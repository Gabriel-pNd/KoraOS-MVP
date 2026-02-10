import test from "node:test";
import assert from "node:assert/strict";

import {
  TERMINAL_STATES,
  buildContingencyAuditLog,
  buildContingencyStatusReport,
  handleSafeModeContingency,
} from "../../src/koraos/o2/s_pc_03_003_contingency_message_and_critical_ticket.js";

test("S-PC-03-003: safe mode activation sends contingency message by intent", async () => {
  const sentMessages = [];

  const result = await handleSafeModeContingency({
    safeModeActive: true,
    intentType: "schedule",
    correlationId: "corr-contingency-1",
    contactId: "contact-1",
    sendContingencyMessage: async (payload) => {
      sentMessages.push(payload);
      return { messageId: "msg-1" };
    },
  });

  assert.equal(
    result.terminalState,
    TERMINAL_STATES.CONTINGENCY_MESSAGE_SENT_TICKET_OPENED
  );
  assert.equal(sentMessages.length, 1);
  assert.ok(sentMessages[0].templateText.includes("agendamento"));
});

test("S-PC-03-003: critical ticket is opened with correlation_id", async () => {
  const openedTickets = [];
  const result = await handleSafeModeContingency({
    safeModeActive: true,
    intentType: "reschedule",
    correlationId: "corr-contingency-2",
    contactId: "contact-2",
    openCriticalTicket: async (payload) => {
      openedTickets.push(payload);
      return { ticketId: "ticket-2" };
    },
  });

  assert.equal(result.ticketStatus, "opened");
  assert.equal(result.ticketId, "ticket-2");
  assert.equal(openedTickets[0].correlationId, "corr-contingency-2");
});

test("S-PC-03-003: message failure still opens ticket and keeps continuity", async () => {
  const result = await handleSafeModeContingency({
    safeModeActive: true,
    intentType: "cancel",
    correlationId: "corr-contingency-3",
    contactId: "contact-3",
    sendContingencyMessage: async () => {
      throw new Error("channel failure");
    },
    openCriticalTicket: async () => ({ ticketId: "ticket-3" }),
  });

  assert.equal(
    result.terminalState,
    TERMINAL_STATES.CONTINGENCY_MESSAGE_FAILED_TICKET_OPENED
  );
  assert.equal(result.ticketId, "ticket-3");
});

test("S-PC-03-003: status report consolidates terminal states and ticket latency", () => {
  const audit = buildContingencyAuditLog({
    correlationId: "corr-audit-1",
    contactId: "contact-audit-1",
    intentType: "schedule",
    terminalState: TERMINAL_STATES.CONTINGENCY_MESSAGE_SENT_TICKET_OPENED,
    messageStatus: "sent",
    ticketStatus: "opened",
    ticketId: "ticket-audit-1",
    ticketOpenLatencyMs: 120,
  });

  assert.equal(audit.correlation_id, "corr-audit-1");
  assert.equal(audit.ticket_open_latency_ms, 120);

  const report = buildContingencyStatusReport([
    { terminalState: TERMINAL_STATES.CONTINGENCY_MESSAGE_SENT_TICKET_OPENED, ticketOpenLatencyMs: 120 },
    { terminalState: TERMINAL_STATES.CONTINGENCY_MESSAGE_FAILED_TICKET_OPENED, ticketOpenLatencyMs: 200 },
    { terminalState: TERMINAL_STATES.TICKET_OPEN_FAILED_ALERTED, ticketOpenLatencyMs: null },
  ]);

  assert.equal(report.totals.contingency_message_sent_ticket_opened, 1);
  assert.equal(report.totals.contingency_message_failed_ticket_opened, 1);
  assert.equal(report.totals.ticket_open_failed_alerted, 1);
  assert.equal(report.ticket_open_latency_p95_ms, 200);
});
