import test from "node:test";
import assert from "node:assert/strict";

import {
  TERMINAL_STATES,
  buildReplayVersionAuditLog,
  validateReplayVersionAndAsOf,
} from "../../src/koraos/o1/s_pc_02_002_replay_version_asof_validation.js";

test("S-PC-02-002: matching version and as_of is ready for replay", () => {
  const result = validateReplayVersionAndAsOf({
    replayEvent: {
      eventVersion: 7,
      asOfUtc: "2026-02-10T10:30:00Z",
      correlationId: "corr-version-ok",
    },
    currentStateSnapshot: {
      currentVersion: 7,
      currentAsOfUtc: "2026-02-10T10:30:00Z",
    },
  });

  assert.equal(result.terminalState, TERMINAL_STATES.VERSION_MATCH_READY_FOR_REPLAY);
  assert.equal(result.reason, "version_as_of_match");
});

test("S-PC-02-002: stale version is blocked as conflict", () => {
  const result = validateReplayVersionAndAsOf({
    replayEvent: {
      eventVersion: 6,
      asOfUtc: "2026-02-10T10:30:00Z",
      correlationId: "corr-version-stale",
    },
    currentStateSnapshot: {
      currentVersion: 7,
      currentAsOfUtc: "2026-02-10T10:30:00Z",
    },
  });

  assert.equal(result.terminalState, TERMINAL_STATES.CONFLICT_BLOCKED);
  assert.equal(result.reason, "version_mismatch");
});

test("S-PC-02-002: stale as_of is blocked as conflict", () => {
  const result = validateReplayVersionAndAsOf({
    replayEvent: {
      eventVersion: 7,
      asOfUtc: "2026-02-10T10:29:00Z",
      correlationId: "corr-asof-stale",
    },
    currentStateSnapshot: {
      currentVersion: 7,
      currentAsOfUtc: "2026-02-10T10:30:00Z",
    },
  });

  assert.equal(result.terminalState, TERMINAL_STATES.CONFLICT_BLOCKED);
  assert.equal(result.reason, "stale_as_of");
});

test("S-PC-02-002: structured logs include expected and event version/as_of", () => {
  const auditLog = buildReplayVersionAuditLog({
    correlationId: "corr-log-version-1",
    expectedVersion: 9,
    eventVersion: 8,
    expectedAsOfUtc: "2026-02-10T11:00:00Z",
    eventAsOfUtc: "2026-02-10T10:59:00Z",
    terminalState: TERMINAL_STATES.CONFLICT_BLOCKED,
    reason: "stale_as_of",
  });

  assert.deepEqual(Object.keys(auditLog), [
    "correlation_id",
    "expected_version",
    "event_version",
    "expected_as_of_utc",
    "event_as_of_utc",
    "result",
    "reason",
  ]);
  assert.equal(auditLog.expected_version, 9);
  assert.equal(auditLog.event_version, 8);
  assert.equal(auditLog.result, TERMINAL_STATES.CONFLICT_BLOCKED);
});
