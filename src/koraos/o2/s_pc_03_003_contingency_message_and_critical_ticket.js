export const TERMINAL_STATES = Object.freeze({
  CONTINGENCY_MESSAGE_SENT_TICKET_OPENED: "contingency_message_sent_ticket_opened",
  CONTINGENCY_MESSAGE_FAILED_TICKET_OPENED: "contingency_message_failed_ticket_opened",
  TICKET_OPEN_FAILED_ALERTED: "ticket_open_failed_alerted",
});

export const CONTINGENCY_TEMPLATES = Object.freeze({
  schedule: "Estamos em contingencia tecnica. Seu agendamento sera priorizado no proximo turno.",
  reschedule:
    "Estamos em contingencia tecnica. Seu reagendamento foi recebido e seguira para fila segura.",
  cancel:
    "Estamos em contingencia tecnica. Seu pedido de cancelamento foi registrado para validacao segura.",
  default:
    "Estamos em contingencia tecnica. Sua solicitacao foi registrada e segue em acompanhamento.",
});

export async function handleSafeModeContingency({
  safeModeActive,
  intentType,
  correlationId,
  contactId,
  channel = "whatsapp",
  sendContingencyMessage = async () => ({ messageId: "msg-1" }),
  openCriticalTicket = async () => ({ ticketId: "ticket-1", openedAtUtc: new Date().toISOString() }),
  emitOpsAlert = async () => ({ alertId: "alert-1" }),
}) {
  if (!safeModeActive) {
    return buildResult({
      terminalState: TERMINAL_STATES.TICKET_OPEN_FAILED_ALERTED,
      reason: "safe_mode_not_active",
      correlationId,
      contactId,
      intentType,
      templateText: null,
      messageStatus: "not_sent",
      messageId: null,
      ticketStatus: "not_opened",
      ticketId: null,
      alertId: null,
      ticketOpenLatencyMs: null,
    });
  }

  const templateText = resolveTemplate(intentType);
  let messageId = null;
  let messageStatus = "sent";
  let messageFailed = false;

  try {
    const messageResult = await sendContingencyMessage({
      intentType,
      contactId,
      correlationId,
      channel,
      templateText,
    });
    messageId = messageResult && messageResult.messageId ? messageResult.messageId : null;
  } catch (_error) {
    messageStatus = "failed";
    messageFailed = true;
  }

  const ticketOpenStartedAt = Date.now();
  try {
    const ticketResult = await openCriticalTicket({
      correlationId,
      contactId,
      priority: "P0",
      reason: "safe_mode_active_contingency",
      messageStatus,
      intentType,
    });

    const ticketOpenLatencyMs = Date.now() - ticketOpenStartedAt;
    return buildResult({
      terminalState: messageFailed
        ? TERMINAL_STATES.CONTINGENCY_MESSAGE_FAILED_TICKET_OPENED
        : TERMINAL_STATES.CONTINGENCY_MESSAGE_SENT_TICKET_OPENED,
      reason: messageFailed ? "message_failed_ticket_opened" : "message_sent_ticket_opened",
      correlationId,
      contactId,
      intentType,
      templateText,
      messageStatus,
      messageId,
      ticketStatus: "opened",
      ticketId: ticketResult && ticketResult.ticketId ? ticketResult.ticketId : null,
      alertId: null,
      ticketOpenLatencyMs,
    });
  } catch (_error) {
    const alertResult = await emitOpsAlert({
      correlationId,
      contactId,
      reason: "ticket_open_failed",
      intentType,
      messageStatus,
    });

    return buildResult({
      terminalState: TERMINAL_STATES.TICKET_OPEN_FAILED_ALERTED,
      reason: "ticket_open_failed_alerted",
      correlationId,
      contactId,
      intentType,
      templateText,
      messageStatus,
      messageId,
      ticketStatus: "failed",
      ticketId: null,
      alertId: alertResult && alertResult.alertId ? alertResult.alertId : null,
      ticketOpenLatencyMs: null,
    });
  }
}

export function buildContingencyAuditLog({
  correlationId,
  contactId,
  intentType,
  terminalState,
  messageStatus,
  ticketStatus,
  ticketId,
  ticketOpenLatencyMs,
}) {
  return {
    correlation_id: correlationId || null,
    contact_id: contactId || null,
    intent: intentType || null,
    terminal_state: terminalState,
    message_status: messageStatus || null,
    ticket_status: ticketStatus || null,
    ticket_id: ticketId || null,
    ticket_open_latency_ms:
      ticketOpenLatencyMs == null ? null : ticketOpenLatencyMs,
  };
}

export function buildContingencyStatusReport(results = []) {
  const report = {
    totals: {
      contingency_message_sent_ticket_opened: 0,
      contingency_message_failed_ticket_opened: 0,
      ticket_open_failed_alerted: 0,
    },
    ticket_open_latency_p95_ms: 0,
  };

  const latencies = [];
  for (const result of results) {
    if (!result || !result.terminalState || report.totals[result.terminalState] == null) {
      continue;
    }
    report.totals[result.terminalState] += 1;
    if (Number.isFinite(result.ticketOpenLatencyMs)) {
      latencies.push(result.ticketOpenLatencyMs);
    }
  }

  report.ticket_open_latency_p95_ms = percentile95(latencies);
  return report;
}

function buildResult({
  terminalState,
  reason,
  correlationId,
  contactId,
  intentType,
  templateText,
  messageStatus,
  messageId,
  ticketStatus,
  ticketId,
  alertId,
  ticketOpenLatencyMs,
}) {
  return {
    terminalState,
    reason,
    templateText,
    messageStatus,
    messageId,
    ticketStatus,
    ticketId,
    alertId,
    ticketOpenLatencyMs,
    auditLog: buildContingencyAuditLog({
      correlationId,
      contactId,
      intentType,
      terminalState,
      messageStatus,
      ticketStatus,
      ticketId,
      ticketOpenLatencyMs,
    }),
  };
}

function resolveTemplate(intentType) {
  const normalizedIntent = String(intentType || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_");
  return CONTINGENCY_TEMPLATES[normalizedIntent] || CONTINGENCY_TEMPLATES.default;
}

function percentile95(values) {
  if (!values.length) {
    return 0;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil(sorted.length * 0.95) - 1;
  return sorted[Math.max(0, index)];
}
