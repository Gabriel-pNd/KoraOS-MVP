export const TERMINAL_STATES = Object.freeze({
  QUEUED_FOR_DISPATCH: "queued_for_dispatch",
  BLOCKED_COMMIT_ORDER_VIOLATION: "blocked_commit_order_violation",
  INVALID_PAYLOAD_MANUAL: "invalid_payload_manual",
});

function toPriority(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toEpoch(value) {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER;
}

export function sortForDispatch(events) {
  return [...(events || [])].sort((left, right) => {
    const leftPriority = toPriority(left && left.dispatchPriority);
    const rightPriority = toPriority(right && right.dispatchPriority);
    if (leftPriority !== rightPriority) {
      return rightPriority - leftPriority;
    }

    const leftReceivedAt = toEpoch(left && left.receivedAtUtc);
    const rightReceivedAt = toEpoch(right && right.receivedAtUtc);
    if (leftReceivedAt !== rightReceivedAt) {
      return leftReceivedAt - rightReceivedAt;
    }

    const leftId = String((left && left.eventId) || "");
    const rightId = String((right && right.eventId) || "");
    return leftId.localeCompare(rightId);
  });
}

export function validateQueueEvent(event, lastCommitOrderByContact = new Map()) {
  if (!event || typeof event.contactId !== "string" || event.contactId.trim() === "") {
    return buildResult({
      event,
      terminalState: TERMINAL_STATES.INVALID_PAYLOAD_MANUAL,
      reason: "missing_contact_id",
    });
  }

  if (!Number.isInteger(event.commitOrder) || event.commitOrder <= 0) {
    return buildResult({
      event,
      terminalState: TERMINAL_STATES.INVALID_PAYLOAD_MANUAL,
      reason: "invalid_commit_order",
    });
  }

  const lastCommitOrder = Number(lastCommitOrderByContact.get(event.contactId) || 0);
  if (event.commitOrder <= lastCommitOrder) {
    return buildResult({
      event,
      terminalState: TERMINAL_STATES.BLOCKED_COMMIT_ORDER_VIOLATION,
      reason: "commit_order_not_monotonic",
    });
  }

  return buildResult({
    event: { ...event },
    terminalState: TERMINAL_STATES.QUEUED_FOR_DISPATCH,
    reason: "ready_for_dispatch",
  });
}

export function buildDispatchAuditLog({
  correlationId,
  contactId,
  dispatchPriority,
  commitOrder,
  terminalState,
  reason,
}) {
  return {
    correlation_id: correlationId || null,
    contact_id: contactId || null,
    dispatch_priority: dispatchPriority == null ? null : dispatchPriority,
    commit_order: commitOrder == null ? null : commitOrder,
    terminal_state: terminalState,
    reason: reason || null,
  };
}

function buildResult({ event, terminalState, reason }) {
  return {
    terminalState,
    reason,
    event,
    auditLog: buildDispatchAuditLog({
      correlationId: event && event.correlationId,
      contactId: event && event.contactId,
      dispatchPriority: event && event.dispatchPriority,
      commitOrder: event && event.commitOrder,
      terminalState,
      reason,
    }),
  };
}
