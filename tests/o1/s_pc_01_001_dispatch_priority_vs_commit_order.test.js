import test from "node:test";
import assert from "node:assert/strict";

import {
  TERMINAL_STATES,
  buildDispatchAuditLog,
  sortForDispatch,
  validateQueueEvent,
} from "../../src/koraos/o1/s_pc_01_001_dispatch_priority_vs_commit_order.js";

test("S-PC-01-001: dispatch_priority does not alter commit_order", () => {
  const lastCommitOrderByContact = new Map([["contact-1", 0]]);
  const queueEvents = [
    {
      eventId: "evt-low-priority",
      contactId: "contact-1",
      dispatchPriority: 10,
      commitOrder: 1,
      correlationId: "corr-1",
      receivedAtUtc: "2026-02-10T13:00:00Z",
    },
    {
      eventId: "evt-high-priority",
      contactId: "contact-1",
      dispatchPriority: 100,
      commitOrder: 2,
      correlationId: "corr-2",
      receivedAtUtc: "2026-02-10T13:00:01Z",
    },
  ];

  const orderedForDispatch = sortForDispatch(queueEvents);
  assert.deepEqual(orderedForDispatch.map((item) => item.eventId), [
    "evt-high-priority",
    "evt-low-priority",
  ]);

  const highPriorityValidation = validateQueueEvent(
    orderedForDispatch[0],
    lastCommitOrderByContact
  );
  const lowPriorityValidation = validateQueueEvent(
    orderedForDispatch[1],
    lastCommitOrderByContact
  );

  assert.equal(highPriorityValidation.terminalState, TERMINAL_STATES.QUEUED_FOR_DISPATCH);
  assert.equal(lowPriorityValidation.terminalState, TERMINAL_STATES.QUEUED_FOR_DISPATCH);
  assert.equal(highPriorityValidation.auditLog.commit_order, 2);
  assert.equal(lowPriorityValidation.auditLog.commit_order, 1);
});

test("S-PC-01-001: commit order violation is blocked safely", () => {
  const lastCommitOrderByContact = new Map([["contact-2", 2]]);

  const result = validateQueueEvent(
    {
      eventId: "evt-order-violation",
      contactId: "contact-2",
      dispatchPriority: 90,
      commitOrder: 2,
      correlationId: "corr-order-violation",
    },
    lastCommitOrderByContact
  );

  assert.equal(
    result.terminalState,
    TERMINAL_STATES.BLOCKED_COMMIT_ORDER_VIOLATION
  );
  assert.equal(result.reason, "commit_order_not_monotonic");
});

test("S-PC-01-001: concurrent events by contact remain queue-safe", () => {
  const queueEvents = [];
  for (let index = 1; index <= 20; index += 1) {
    queueEvents.push({
      eventId: `evt-${index}`,
      contactId: "contact-3",
      dispatchPriority: (index % 3) * 10,
      commitOrder: index,
      correlationId: `corr-${index}`,
      receivedAtUtc: `2026-02-10T13:00:${String(index).padStart(2, "0")}Z`,
    });
  }

  const sorted = sortForDispatch(queueEvents);
  const validationResults = sorted.map((event) =>
    validateQueueEvent(event, new Map([["contact-3", 0]]))
  );

  assert.equal(validationResults.length, 20);
  assert.ok(
    validationResults.every(
      (result) => result.terminalState === TERMINAL_STATES.QUEUED_FOR_DISPATCH
    )
  );
});

test("S-PC-01-001: structured logs include correlation fields", () => {
  const auditLog = buildDispatchAuditLog({
    correlationId: "corr-log-1",
    contactId: "contact-log-1",
    dispatchPriority: 70,
    commitOrder: 4,
    terminalState: TERMINAL_STATES.QUEUED_FOR_DISPATCH,
    reason: "ready_for_dispatch",
  });

  assert.deepEqual(Object.keys(auditLog), [
    "correlation_id",
    "contact_id",
    "dispatch_priority",
    "commit_order",
    "terminal_state",
    "reason",
  ]);
  assert.equal(auditLog.correlation_id, "corr-log-1");
  assert.equal(auditLog.dispatch_priority, 70);
  assert.equal(auditLog.commit_order, 4);
});
