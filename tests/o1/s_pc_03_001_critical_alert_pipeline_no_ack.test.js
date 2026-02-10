import test from "node:test";
import assert from "node:assert/strict";

import {
  ALERT_POLICY_DEFAULTS,
  TERMINAL_STATES,
  buildCriticalAlertLog,
  executeCriticalAlertPipeline,
} from "../../src/koraos/o1/s_pc_03_001_critical_alert_pipeline_no_ack.js";

test("S-PC-03-001: critical trigger sends primary plus redundant alert", async () => {
  const dispatches = [];
  const result = await executeCriticalAlertPipeline({
    triggerId: "trigger-001",
    correlationId: "corr-001",
    occurredAtUtc: "2026-02-10T10:00:00Z",
    ackAtMinute: 1,
    sendAlert: async (payload) => {
      dispatches.push(payload);
      return { delivered: true };
    },
  });

  assert.equal(result.terminalState, TERMINAL_STATES.ACK_RECEIVED);
  assert.equal(dispatches[0].attemptType, "primary");
  assert.equal(dispatches[1].attemptType, "redundant");
  assert.equal(dispatches.length, 2);
});

test("S-PC-03-001: no ACK triggers retries every 5 minutes until 30 minutes", async () => {
  const dispatches = [];
  const result = await executeCriticalAlertPipeline({
    triggerId: "trigger-002",
    correlationId: "corr-002",
    occurredAtUtc: "2026-02-10T10:00:00Z",
    policy: {
      ...ALERT_POLICY_DEFAULTS,
      retryIntervalMinutes: 5,
      maxRetryWindowMinutes: 30,
    },
    ackAtMinute: null,
    sendAlert: async (payload) => {
      dispatches.push(payload);
      return { delivered: true };
    },
  });

  const retryDispatches = dispatches.filter((item) => item.attemptType === "retry");
  assert.equal(result.terminalState, TERMINAL_STATES.ACK_TIMEOUT_ESCALATED);
  assert.equal(retryDispatches.length, 6);
  assert.deepEqual(
    retryDispatches.map((item) => item.sentAtUtc),
    [
      "2026-02-10T10:05:00.000Z",
      "2026-02-10T10:10:00.000Z",
      "2026-02-10T10:15:00.000Z",
      "2026-02-10T10:20:00.000Z",
      "2026-02-10T10:25:00.000Z",
      "2026-02-10T10:30:00.000Z",
    ]
  );
});

test("S-PC-03-001: ACK received interrupts retries", async () => {
  const dispatches = [];
  const result = await executeCriticalAlertPipeline({
    triggerId: "trigger-003",
    correlationId: "corr-003",
    occurredAtUtc: "2026-02-10T10:00:00Z",
    ackAtMinute: 10,
    sendAlert: async (payload) => {
      dispatches.push(payload);
      return { delivered: true };
    },
  });

  const retryDispatches = dispatches.filter((item) => item.attemptType === "retry");
  assert.equal(result.terminalState, TERMINAL_STATES.ACK_RECEIVED);
  assert.equal(retryDispatches.length, 1);
  assert.equal(retryDispatches[0].sentAtUtc, "2026-02-10T10:05:00.000Z");
  assert.equal(result.ackAtUtc, "2026-02-10T10:10:00.000Z");
});

test("S-PC-03-001: logs include trigger channel timestamp attempt and ACK", () => {
  const log = buildCriticalAlertLog({
    triggerId: "trigger-log-001",
    correlationId: "corr-log-001",
    channel: "superadmin_whatsapp",
    sentAtUtc: "2026-02-10T10:05:00Z",
    attempt: 3,
    ackReceived: false,
    attemptType: "retry",
  });

  assert.deepEqual(Object.keys(log), [
    "trigger_id",
    "correlation_id",
    "channel",
    "sent_at_utc",
    "attempt",
    "ack",
    "attempt_type",
  ]);
  assert.equal(log.trigger_id, "trigger-log-001");
  assert.equal(log.channel, "superadmin_whatsapp");
  assert.equal(log.attempt, 3);
  assert.equal(log.ack, false);
});
