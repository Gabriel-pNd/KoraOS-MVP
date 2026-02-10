import test from "node:test";
import assert from "node:assert/strict";

import {
  SAFE_MODE_POLICY_DEFAULTS,
  TERMINAL_STATES,
  SafeModeRuntime,
  activateSafeModeOnNoAck,
} from "../../src/koraos/o1/s_pc_03_002_safe_mode_entry_on_no_ack.js";
import {
  TERMINAL_STATES as CRITICAL_ALERT_TERMINAL_STATES,
} from "../../src/koraos/o1/s_pc_03_001_critical_alert_pipeline_no_ack.js";

test("S-PC-03-002: no ACK for 15 minutes activates safe mode", async () => {
  const runtime = new SafeModeRuntime();
  const result = await activateSafeModeOnNoAck({
    triggerId: "trigger-safe-001",
    correlationId: "corr-safe-001",
    elapsedWithoutAckMinutes: 15,
    runtime,
    policy: SAFE_MODE_POLICY_DEFAULTS,
  });

  assert.equal(result.terminalState, TERMINAL_STATES.SAFE_MODE_ACTIVE);
  assert.equal(result.safeModeActive, true);
});

test("S-PC-03-002: in safe mode scheduling side-effects are blocked", async () => {
  const runtime = new SafeModeRuntime();
  await activateSafeModeOnNoAck({
    triggerId: "trigger-safe-002",
    correlationId: "corr-safe-002",
    elapsedWithoutAckMinutes: 15,
    runtime,
  });

  const scheduleCommand = runtime.evaluateSideEffect({ commandType: "schedule" });
  const rescheduleCommand = runtime.evaluateSideEffect({ commandType: "reschedule" });
  const cancelCommand = runtime.evaluateSideEffect({ commandType: "cancel" });
  const followUpCommand = runtime.evaluateSideEffect({ commandType: "follow_up" });

  assert.equal(scheduleCommand.allowed, false);
  assert.equal(rescheduleCommand.allowed, false);
  assert.equal(cancelCommand.allowed, false);
  assert.equal(followUpCommand.allowed, true);
});

test("S-PC-03-002: ingestion continues and pending side-effects are queued", async () => {
  const runtime = new SafeModeRuntime();
  await activateSafeModeOnNoAck({
    triggerId: "trigger-safe-003",
    correlationId: "corr-safe-003",
    elapsedWithoutAckMinutes: 15,
    runtime,
  });

  const ingestResult = runtime.ingestEvent({
    eventId: "event-1",
    payload: "incoming-message",
  });
  const blockedSchedule = runtime.evaluateSideEffect({ commandType: "schedule" });
  const blockedCancel = runtime.evaluateSideEffect({ commandType: "cancel" });

  assert.equal(ingestResult.ingested, true);
  assert.equal(runtime.ingestedEvents.length, 1);
  assert.equal(blockedSchedule.queued, true);
  assert.equal(blockedCancel.queued, true);
  assert.equal(runtime.pendingSideEffects.length, 2);
});

test("S-PC-03-002: contingency message and critical ticket are emitted", async () => {
  const runtime = new SafeModeRuntime();
  const emitted = {
    messages: [],
    tickets: [],
  };

  const result = await activateSafeModeOnNoAck({
    triggerId: "trigger-safe-004",
    correlationId: "corr-safe-004",
    elapsedWithoutAckMinutes: 15,
    runtime,
    sendContingencyMessage: async (payload) => {
      emitted.messages.push(payload);
      return { messageId: "message-safe-1" };
    },
    createCriticalTicket: async (payload) => {
      emitted.tickets.push(payload);
      return { ticketId: "ticket-safe-1" };
    },
  });

  assert.equal(result.terminalState, TERMINAL_STATES.SAFE_MODE_ACTIVE);
  assert.equal(result.contingencyMessageId, "message-safe-1");
  assert.equal(result.criticalTicketId, "ticket-safe-1");
  assert.equal(emitted.messages.length, 1);
  assert.equal(emitted.tickets.length, 1);
});

test("S-PC-03-002: critical alert timeout can trigger safe mode activation", async () => {
  const runtime = new SafeModeRuntime();
  const result = await activateSafeModeOnNoAck({
    triggerId: "trigger-safe-005",
    correlationId: "corr-safe-005",
    elapsedWithoutAckMinutes: 0,
    runtime,
    criticalAlertResult: {
      terminalState: CRITICAL_ALERT_TERMINAL_STATES.ACK_TIMEOUT_ESCALATED,
    },
  });

  assert.equal(result.terminalState, TERMINAL_STATES.SAFE_MODE_ACTIVE);
  assert.equal(result.safeModeActive, true);
});
