export const TERMINAL_STATES = Object.freeze({
  ALERT_FIRED_ACKNOWLEDGED: "alert_fired_acknowledged",
  ALERT_FIRED_NO_ACK_ESCALATED: "alert_fired_no_ack_escalated",
});

export const ALERT_MATRIX = Object.freeze({
  no_ack_critical_alert: Object.freeze({
    owner: "superadmin",
    channel: "whatsapp",
    fallbackChannel: "sms",
    ackSlaMinutes: 15,
    warningAtMinutes: 5,
    highAtMinutes: 10,
    criticalAtMinutes: 15,
  }),
  ack_to_enqueue_gap: Object.freeze({
    owner: "sre_oncall",
    channel: "ops_chat",
    fallbackChannel: "email",
    ackSlaMinutes: 10,
    warningThreshold: "p95_gt_2m",
    criticalThreshold: "p95_gt_5m_or_events_gt_20",
  }),
  takeover_sla_breach_rate: Object.freeze({
    owner: "sre_qa",
    channel: "ops_chat",
    fallbackChannel: "email",
    ackSlaMinutes: 10,
    warningThreshold: "rate_gt_5pct_60m",
    criticalThreshold: "rate_gt_12pct_60m",
  }),
  replay_backlog: Object.freeze({
    owner: "sre_superadmin",
    channel: "ops_chat",
    fallbackChannel: "email",
    ackSlaMinutes: 15,
    warningThreshold: "backlog_gt_30_or_p95_age_gt_15m",
    criticalThreshold: "backlog_gt_80_or_p95_age_gt_30m",
  }),
});

export async function processOperationalAlert({
  alertType,
  correlationId,
  triggerPayload,
  ackAtMinute = null,
  sendAlert = async () => ({ delivered: true }),
  escalateIncident = async () => ({ incidentId: "incident-1" }),
}) {
  const matrixEntry = ALERT_MATRIX[alertType];
  if (!matrixEntry) {
    return {
      terminalState: TERMINAL_STATES.ALERT_FIRED_NO_ACK_ESCALATED,
      reason: "unknown_alert_type",
      alertLog: null,
      incidentId: null,
    };
  }

  const alertLog = buildOperationalAlertLog({
    alertType,
    correlationId,
    owner: matrixEntry.owner,
    channel: matrixEntry.channel,
    triggerPayload,
    ackSlaMinutes: matrixEntry.ackSlaMinutes,
    status: "fired",
  });

  let deliverySuccessful = true;
  try {
    await sendAlert({
      alertType,
      correlationId,
      channel: matrixEntry.channel,
      owner: matrixEntry.owner,
      triggerPayload,
    });
  } catch (_error) {
    deliverySuccessful = false;
    if (matrixEntry.fallbackChannel) {
      try {
        await sendAlert({
          alertType,
          correlationId,
          channel: matrixEntry.fallbackChannel,
          owner: matrixEntry.owner,
          triggerPayload,
        });
        deliverySuccessful = true;
      } catch (_fallbackError) {
        deliverySuccessful = false;
      }
    }
  }

  const ackedInTime = Number.isFinite(ackAtMinute) && ackAtMinute <= matrixEntry.ackSlaMinutes;
  if (deliverySuccessful && ackedInTime) {
    return {
      terminalState: TERMINAL_STATES.ALERT_FIRED_ACKNOWLEDGED,
      reason: "alert_acknowledged_within_sla",
      alertLog: {
        ...alertLog,
        status: "acknowledged",
        ack_at_minute: ackAtMinute,
      },
      incidentId: null,
    };
  }

  const escalation = await escalateIncident({
    alertType,
    correlationId,
    owner: matrixEntry.owner,
    reason: deliverySuccessful ? "no_ack_in_sla" : "delivery_failed_no_ack",
  });

  return {
    terminalState: TERMINAL_STATES.ALERT_FIRED_NO_ACK_ESCALATED,
    reason: deliverySuccessful ? "no_ack_in_sla" : "delivery_failed_no_ack",
    alertLog: {
      ...alertLog,
      status: "escalated",
      ack_at_minute: Number.isFinite(ackAtMinute) ? ackAtMinute : null,
    },
    incidentId: escalation && escalation.incidentId ? escalation.incidentId : null,
  };
}

export function buildOperationalAlertLog({
  alertType,
  correlationId,
  owner,
  channel,
  triggerPayload,
  ackSlaMinutes,
  status,
}) {
  return {
    alert_type: alertType || null,
    correlation_id: correlationId || null,
    owner: owner || null,
    channel: channel || null,
    trigger_payload: triggerPayload || {},
    ack_sla_minutes: ackSlaMinutes == null ? null : ackSlaMinutes,
    status: status || null,
    ts: new Date().toISOString(),
  };
}

export function buildOperationalAlertHistoryReport(alertResults = []) {
  const report = {
    totals: {
      alert_fired_acknowledged: 0,
      alert_fired_no_ack_escalated: 0,
    },
    byType: {},
  };

  for (const result of alertResults) {
    if (!result || !result.terminalState || report.totals[result.terminalState] == null) {
      continue;
    }
    report.totals[result.terminalState] += 1;

    const alertType =
      result.alertLog && result.alertLog.alert_type ? result.alertLog.alert_type : "unknown";
    if (!report.byType[alertType]) {
      report.byType[alertType] = {
        acknowledged: 0,
        escalated: 0,
        owners: new Set(),
      };
    }

    if (result.terminalState === TERMINAL_STATES.ALERT_FIRED_ACKNOWLEDGED) {
      report.byType[alertType].acknowledged += 1;
    } else {
      report.byType[alertType].escalated += 1;
    }

    if (result.alertLog && result.alertLog.owner) {
      report.byType[alertType].owners.add(result.alertLog.owner);
    }
  }

  for (const value of Object.values(report.byType)) {
    value.owners = [...value.owners];
  }

  return report;
}
