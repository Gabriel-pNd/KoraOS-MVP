export const TERMINAL_STATES = Object.freeze({
  ACK_RECEIVED: "ack_received",
  ACK_TIMEOUT_ESCALATED: "ack_timeout_escalated",
});

export const ALERT_POLICY_DEFAULTS = Object.freeze({
  retryIntervalMinutes: 5,
  maxRetryWindowMinutes: 30,
  safeModeTriggerMinutes: 15,
});

export const ALERT_ROUTING_MATRIX = Object.freeze({
  no_ack_critical_alert: Object.freeze({
    primaryChannel: "ops_primary_channel",
    redundantChannel: "superadmin_whatsapp",
    retryChannel: "superadmin_whatsapp",
    fallbackChannel: "superadmin_sms_fallback",
    owner: "superadmin",
    ackSlaMinutes: 15,
  }),
});

export async function executeCriticalAlertPipeline({
  triggerId,
  correlationId,
  occurredAtUtc,
  policy = ALERT_POLICY_DEFAULTS,
  routing = ALERT_ROUTING_MATRIX.no_ack_critical_alert,
  ackAtMinute = null,
  sendAlert = async () => ({ delivered: true }),
}) {
  const startedAtDate = parseDate(occurredAtUtc);
  if (!triggerId || !startedAtDate || !routing) {
    return buildResult({
      triggerId,
      correlationId,
      terminalState: TERMINAL_STATES.ACK_TIMEOUT_ESCALATED,
      reason: "invalid_alert_input",
      ackAtUtc: null,
      safeModeEligibleAtUtc: null,
      attempts: [],
      notificationErrors: [],
    });
  }

  const attempts = [];
  const notificationErrors = [];
  let attemptCounter = 0;

  const sendWithFallback = async ({ channel, minuteOffset, attemptType }) => {
    attemptCounter += 1;
    const sentAtUtc = addMinutes(startedAtDate, minuteOffset).toISOString();
    try {
      await sendAlert({
        triggerId,
        channel,
        sentAtUtc,
        attempt: attemptCounter,
        attemptType,
      });

      attempts.push(
        buildCriticalAlertLog({
          triggerId,
          correlationId,
          channel,
          sentAtUtc,
          attempt: attemptCounter,
          ackReceived: false,
          attemptType,
        })
      );
      return;
    } catch (error) {
      notificationErrors.push({
        trigger_id: triggerId,
        channel,
        reason: normalizeErrorMessage(error),
      });

      if (routing.fallbackChannel && routing.fallbackChannel !== channel) {
        const fallbackChannel = routing.fallbackChannel;
        try {
          await sendAlert({
            triggerId,
            channel: fallbackChannel,
            sentAtUtc,
            attempt: attemptCounter,
            attemptType: `${attemptType}_fallback`,
          });
          attempts.push(
            buildCriticalAlertLog({
              triggerId,
              correlationId,
              channel: fallbackChannel,
              sentAtUtc,
              attempt: attemptCounter,
              ackReceived: false,
              attemptType: `${attemptType}_fallback`,
            })
          );
          return;
        } catch (fallbackError) {
          notificationErrors.push({
            trigger_id: triggerId,
            channel: fallbackChannel,
            reason: normalizeErrorMessage(fallbackError),
          });
        }
      }

      attempts.push(
        buildCriticalAlertLog({
          triggerId,
          correlationId,
          channel,
          sentAtUtc,
          attempt: attemptCounter,
          ackReceived: false,
          attemptType: `${attemptType}_delivery_failed`,
        })
      );
    }
  };

  await sendWithFallback({
    channel: routing.primaryChannel,
    minuteOffset: 0,
    attemptType: "primary",
  });
  await sendWithFallback({
    channel: routing.redundantChannel,
    minuteOffset: 0,
    attemptType: "redundant",
  });

  const retryInterval = normalizePositiveInt(policy.retryIntervalMinutes, 5);
  const maxWindow = normalizePositiveInt(policy.maxRetryWindowMinutes, 30);
  for (let minute = retryInterval; minute <= maxWindow; minute += retryInterval) {
    if (isAckReceivedAtOrBefore({ ackAtMinute, minute })) {
      break;
    }

    await sendWithFallback({
      channel: routing.retryChannel || routing.redundantChannel,
      minuteOffset: minute,
      attemptType: "retry",
    });
  }

  const safeModeEligibleAtUtc = addMinutes(
    startedAtDate,
    normalizePositiveInt(policy.safeModeTriggerMinutes, 15)
  ).toISOString();

  if (isAckReceivedInsideWindow({ ackAtMinute, maxWindow })) {
    const ackAtUtc = addMinutes(startedAtDate, ackAtMinute).toISOString();
    attempts.push(
      buildCriticalAlertLog({
        triggerId,
        correlationId,
        channel: "ack_channel",
        sentAtUtc: ackAtUtc,
        attempt: attemptCounter,
        ackReceived: true,
        attemptType: "ack_received",
      })
    );
    return buildResult({
      triggerId,
      correlationId,
      terminalState: TERMINAL_STATES.ACK_RECEIVED,
      reason: "ack_received_within_window",
      ackAtUtc,
      safeModeEligibleAtUtc,
      attempts,
      notificationErrors,
    });
  }

  return buildResult({
    triggerId,
    correlationId,
    terminalState: TERMINAL_STATES.ACK_TIMEOUT_ESCALATED,
    reason: "ack_not_received_within_window",
    ackAtUtc: null,
    safeModeEligibleAtUtc,
    attempts,
    notificationErrors,
  });
}

export function buildCriticalAlertLog({
  triggerId,
  correlationId,
  channel,
  sentAtUtc,
  attempt,
  ackReceived,
  attemptType,
}) {
  return {
    trigger_id: triggerId || null,
    correlation_id: correlationId || null,
    channel: channel || null,
    sent_at_utc: sentAtUtc || null,
    attempt: attempt == null ? null : attempt,
    ack: Boolean(ackReceived),
    attempt_type: attemptType || null,
  };
}

function buildResult({
  triggerId,
  correlationId,
  terminalState,
  reason,
  ackAtUtc,
  safeModeEligibleAtUtc,
  attempts,
  notificationErrors,
}) {
  return {
    terminalState,
    reason,
    triggerId,
    correlationId,
    ackAtUtc,
    safeModeEligibleAtUtc,
    attempts,
    notificationErrors,
  };
}

function parseDate(value) {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) {
    return null;
  }
  return new Date(timestamp);
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60_000);
}

function normalizePositiveInt(value, fallback) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

function isAckReceivedAtOrBefore({ ackAtMinute, minute }) {
  if (!Number.isFinite(ackAtMinute)) {
    return false;
  }
  return ackAtMinute <= minute;
}

function isAckReceivedInsideWindow({ ackAtMinute, maxWindow }) {
  if (!Number.isFinite(ackAtMinute)) {
    return false;
  }
  return ackAtMinute >= 0 && ackAtMinute <= maxWindow;
}

function normalizeErrorMessage(error) {
  if (!error) {
    return "unknown_error";
  }
  return typeof error.message === "string" && error.message.trim() !== ""
    ? error.message
    : "unknown_error";
}
