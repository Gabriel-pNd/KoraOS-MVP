export const TERMINAL_STATES = Object.freeze({
  VERSION_MATCH_READY_FOR_REPLAY: "version_match_ready_for_replay",
  CONFLICT_BLOCKED: "conflict_blocked",
  INVALID_EVENT_MANUAL: "invalid_event_manual",
});

export function validateReplayVersionAndAsOf({
  replayEvent,
  currentStateSnapshot,
}) {
  if (!replayEvent || !currentStateSnapshot) {
    return buildResult({
      replayEvent,
      currentStateSnapshot,
      terminalState: TERMINAL_STATES.INVALID_EVENT_MANUAL,
      reason: "invalid_payload",
    });
  }

  const eventVersion = parsePositiveInteger(replayEvent.eventVersion);
  const expectedVersion = parsePositiveInteger(currentStateSnapshot.currentVersion);
  if (!eventVersion || !expectedVersion) {
    return buildResult({
      replayEvent,
      currentStateSnapshot,
      terminalState: TERMINAL_STATES.INVALID_EVENT_MANUAL,
      reason: "invalid_version_metadata",
    });
  }

  const eventAsOfDate = parseDate(replayEvent.asOfUtc);
  const expectedAsOfDate = parseDate(currentStateSnapshot.currentAsOfUtc);
  if (!eventAsOfDate || !expectedAsOfDate) {
    return buildResult({
      replayEvent,
      currentStateSnapshot,
      terminalState: TERMINAL_STATES.INVALID_EVENT_MANUAL,
      reason: "invalid_as_of_metadata",
    });
  }

  if (eventVersion !== expectedVersion) {
    return buildResult({
      replayEvent,
      currentStateSnapshot,
      terminalState: TERMINAL_STATES.CONFLICT_BLOCKED,
      reason: "version_mismatch",
    });
  }

  if (eventAsOfDate.getTime() < expectedAsOfDate.getTime()) {
    return buildResult({
      replayEvent,
      currentStateSnapshot,
      terminalState: TERMINAL_STATES.CONFLICT_BLOCKED,
      reason: "stale_as_of",
    });
  }

  return buildResult({
    replayEvent,
    currentStateSnapshot,
    terminalState: TERMINAL_STATES.VERSION_MATCH_READY_FOR_REPLAY,
    reason: "version_as_of_match",
  });
}

export function buildReplayVersionAuditLog({
  correlationId,
  expectedVersion,
  eventVersion,
  expectedAsOfUtc,
  eventAsOfUtc,
  terminalState,
  reason,
}) {
  return {
    correlation_id: correlationId || null,
    expected_version: expectedVersion == null ? null : expectedVersion,
    event_version: eventVersion == null ? null : eventVersion,
    expected_as_of_utc: expectedAsOfUtc || null,
    event_as_of_utc: eventAsOfUtc || null,
    result: terminalState,
    reason: reason || null,
  };
}

function buildResult({ replayEvent, currentStateSnapshot, terminalState, reason }) {
  const expectedVersion = parsePositiveInteger(
    currentStateSnapshot && currentStateSnapshot.currentVersion
  );
  const eventVersion = parsePositiveInteger(replayEvent && replayEvent.eventVersion);
  const expectedAsOfUtc = replayEventDateToIso(currentStateSnapshot && currentStateSnapshot.currentAsOfUtc);
  const eventAsOfUtc = replayEventDateToIso(replayEvent && replayEvent.asOfUtc);

  return {
    terminalState,
    reason,
    auditLog: buildReplayVersionAuditLog({
      correlationId: replayEvent && replayEvent.correlationId,
      expectedVersion,
      eventVersion,
      expectedAsOfUtc,
      eventAsOfUtc,
      terminalState,
      reason,
    }),
  };
}

function parsePositiveInteger(value) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

function parseDate(value) {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) {
    return null;
  }
  return new Date(timestamp);
}

function replayEventDateToIso(value) {
  const parsed = parseDate(value);
  return parsed ? parsed.toISOString() : null;
}
