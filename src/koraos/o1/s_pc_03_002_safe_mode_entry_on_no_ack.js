import {
  TERMINAL_STATES as CRITICAL_ALERT_TERMINAL_STATES,
} from "./s_pc_03_001_critical_alert_pipeline_no_ack.js";

export const TERMINAL_STATES = Object.freeze({
  SAFE_MODE_ACTIVE: "safe_mode_active",
  SAFE_MODE_ACTIVATION_FAILED: "safe_mode_activation_failed",
});

export const SAFE_MODE_POLICY_DEFAULTS = Object.freeze({
  ackTimeoutMinutes: 15,
  activationRetryLimit: 2,
  blockedSideEffects: Object.freeze(["schedule", "reschedule", "cancel"]),
});

export class SafeModeRuntime {
  constructor({ blockedSideEffects = SAFE_MODE_POLICY_DEFAULTS.blockedSideEffects } = {}) {
    this.blockedSideEffects = new Set(blockedSideEffects);
    this.safeModeActive = false;
    this.ingestedEvents = [];
    this.pendingSideEffects = [];
  }

  setSafeModeActive(active) {
    this.safeModeActive = Boolean(active);
  }

  ingestEvent(event) {
    this.ingestedEvents.push(event);
    return {
      ingested: true,
      safeModeActive: this.safeModeActive,
      totalIngested: this.ingestedEvents.length,
    };
  }

  evaluateSideEffect(command) {
    const commandType = normalizeCommandType(command && command.commandType);
    if (this.safeModeActive && this.blockedSideEffects.has(commandType)) {
      const pendingItem = {
        commandType,
        queuedAtUtc: new Date().toISOString(),
      };
      this.pendingSideEffects.push(pendingItem);
      return {
        allowed: false,
        queued: true,
        queueSize: this.pendingSideEffects.length,
        reason: "safe_mode_blocked_side_effect",
      };
    }

    return {
      allowed: true,
      queued: false,
      queueSize: this.pendingSideEffects.length,
      reason: "allowed",
    };
  }
}

export async function activateSafeModeOnNoAck({
  triggerId,
  correlationId,
  elapsedWithoutAckMinutes,
  criticalAlertResult,
  runtime,
  policy = SAFE_MODE_POLICY_DEFAULTS,
  contingencyMessageText = "Estamos operando em contingencia tecnica. Seu atendimento segue em fila segura.",
  activateGlobalSafeMode = async ({ runtimeInstance }) => {
    runtimeInstance.setSafeModeActive(true);
    return { activated: true };
  },
  sendContingencyMessage = async () => ({ messageId: "contingency-message-1" }),
  createCriticalTicket = async () => ({ ticketId: "critical-ticket-1" }),
  emitP0Alert = async () => ({ emitted: true }),
}) {
  const runtimeInstance = runtime || new SafeModeRuntime();
  const timeoutThreshold = normalizePositiveInt(policy.ackTimeoutMinutes, 15);
  const retryLimit = normalizePositiveInt(policy.activationRetryLimit, 2);

  const shouldActivate = evaluateSafeModeTrigger({
    elapsedWithoutAckMinutes,
    timeoutThreshold,
    criticalAlertResult,
  });

  if (!shouldActivate) {
    return buildResult({
      triggerId,
      correlationId,
      runtimeInstance,
      terminalState: TERMINAL_STATES.SAFE_MODE_ACTIVATION_FAILED,
      reason: "ack_timeout_not_reached",
      activationAttempts: 0,
      contingencyMessageId: null,
      criticalTicketId: null,
      alerts: [],
    });
  }

  const activationAlerts = [];
  let activationAttempts = 0;
  let activated = false;

  while (!activated && activationAttempts < retryLimit) {
    activationAttempts += 1;
    try {
      await activateGlobalSafeMode({
        runtimeInstance,
        attempt: activationAttempts,
        triggerId,
      });
      runtimeInstance.setSafeModeActive(true);
      activated = true;
    } catch (error) {
      activationAlerts.push({
        severity: "P0",
        reason: normalizeErrorMessage(error),
        attempt: activationAttempts,
      });
    }
  }

  if (!activated) {
    await emitP0Alert({
      triggerId,
      correlationId,
      reason: "safe_mode_activation_failed",
      attempts: activationAttempts,
    });
    return buildResult({
      triggerId,
      correlationId,
      runtimeInstance,
      terminalState: TERMINAL_STATES.SAFE_MODE_ACTIVATION_FAILED,
      reason: "safe_mode_activation_failed",
      activationAttempts,
      contingencyMessageId: null,
      criticalTicketId: null,
      alerts: activationAlerts,
    });
  }

  const contingencyMessage = await sendContingencyMessage({
    triggerId,
    correlationId,
    message: contingencyMessageText,
  });
  const criticalTicket = await createCriticalTicket({
    triggerId,
    correlationId,
    reason: "safe_mode_active_no_ack_15m",
  });

  return buildResult({
    triggerId,
    correlationId,
    runtimeInstance,
    terminalState: TERMINAL_STATES.SAFE_MODE_ACTIVE,
    reason: "safe_mode_activated_on_no_ack",
    activationAttempts,
    contingencyMessageId: contingencyMessage && contingencyMessage.messageId,
    criticalTicketId: criticalTicket && criticalTicket.ticketId,
    alerts: activationAlerts,
  });
}

export function buildSafeModeAuditLog({
  triggerId,
  correlationId,
  terminalState,
  reason,
  safeModeActive,
  blockedSideEffects,
  pendingQueueSize,
  contingencyMessageId,
  criticalTicketId,
  activationAttempts,
}) {
  return {
    trigger_id: triggerId || null,
    correlation_id: correlationId || null,
    terminal_state: terminalState,
    reason: reason || null,
    safe_mode_active: Boolean(safeModeActive),
    blocked_side_effects: blockedSideEffects || [],
    pending_queue_size: pendingQueueSize == null ? null : pendingQueueSize,
    contingency_message_id: contingencyMessageId || null,
    critical_ticket_id: criticalTicketId || null,
    activation_attempts: activationAttempts == null ? null : activationAttempts,
  };
}

function buildResult({
  triggerId,
  correlationId,
  runtimeInstance,
  terminalState,
  reason,
  activationAttempts,
  contingencyMessageId,
  criticalTicketId,
  alerts,
}) {
  const blockedSideEffects = [...runtimeInstance.blockedSideEffects];
  return {
    terminalState,
    reason,
    safeModeActive: runtimeInstance.safeModeActive,
    blockedSideEffects,
    pendingQueueSize: runtimeInstance.pendingSideEffects.length,
    contingencyMessageId,
    criticalTicketId,
    activationAttempts,
    alerts,
    auditLog: buildSafeModeAuditLog({
      triggerId,
      correlationId,
      terminalState,
      reason,
      safeModeActive: runtimeInstance.safeModeActive,
      blockedSideEffects,
      pendingQueueSize: runtimeInstance.pendingSideEffects.length,
      contingencyMessageId,
      criticalTicketId,
      activationAttempts,
    }),
  };
}

function evaluateSafeModeTrigger({
  elapsedWithoutAckMinutes,
  timeoutThreshold,
  criticalAlertResult,
}) {
  const hasElapsedTimeout =
    Number.isFinite(elapsedWithoutAckMinutes) &&
    elapsedWithoutAckMinutes >= timeoutThreshold;

  if (hasElapsedTimeout) {
    return true;
  }

  if (!criticalAlertResult) {
    return false;
  }

  return (
    criticalAlertResult.terminalState ===
    CRITICAL_ALERT_TERMINAL_STATES.ACK_TIMEOUT_ESCALATED
  );
}

function normalizePositiveInt(value, fallback) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

function normalizeCommandType(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_");
}

function normalizeErrorMessage(error) {
  if (!error || typeof error.message !== "string") {
    return "unknown_error";
  }
  return error.message;
}
