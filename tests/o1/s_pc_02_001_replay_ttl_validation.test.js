import test from "node:test";
import assert from "node:assert/strict";

import {
  TERMINAL_STATES,
  buildReplayTtlAuditLog,
  validateReplayTtl,
} from "../../src/koraos/o1/s_pc_02_001_replay_ttl_validation.js";

test("S-PC-02-001: replay inside TTL is ready for replay", () => {
  const result = validateReplayTtl({
    replayEvent: {
      intentType: "schedule",
      occurredAtUtc: "2026-02-10T10:00:00Z",
      correlationId: "corr-ttl-valid-1",
    },
    nowUtc: "2026-02-10T11:59:00Z",
  });

  assert.equal(result.terminalState, TERMINAL_STATES.TTL_VALID_READY_FOR_REPLAY);
  assert.equal(result.reason, "ttl_valid");
});

test("S-PC-02-001: expired replay is routed to expired_manual", () => {
  const result = validateReplayTtl({
    replayEvent: {
      intentType: "cancel",
      occurredAtUtc: "2026-02-10T10:00:00Z",
      correlationId: "corr-ttl-expired-1",
    },
    nowUtc: "2026-02-10T12:01:00Z",
  });

  assert.equal(result.terminalState, TERMINAL_STATES.EXPIRED_MANUAL);
  assert.equal(result.reason, "ttl_expired");
});

test("S-PC-02-001: D-1 boundary honors appointment_start minus 30 min", () => {
  const validBoundaryResult = validateReplayTtl({
    replayEvent: {
      intentType: "d1_confirmation",
      occurredAtUtc: "2026-02-10T06:00:00Z",
      appointmentStartUtc: "2026-02-10T10:00:00Z",
      correlationId: "corr-d1-valid",
    },
    nowUtc: "2026-02-10T09:29:00Z",
  });
  const expiredBoundaryResult = validateReplayTtl({
    replayEvent: {
      intentType: "d1_confirmation",
      occurredAtUtc: "2026-02-10T06:00:00Z",
      appointmentStartUtc: "2026-02-10T10:00:00Z",
      correlationId: "corr-d1-expired",
    },
    nowUtc: "2026-02-10T09:31:00Z",
  });

  assert.equal(
    validBoundaryResult.terminalState,
    TERMINAL_STATES.TTL_VALID_READY_FOR_REPLAY
  );
  assert.equal(expiredBoundaryResult.terminalState, TERMINAL_STATES.EXPIRED_MANUAL);
});

test("S-PC-02-001: structured logs include intent age and TTL fields", () => {
  const auditLog = buildReplayTtlAuditLog({
    correlationId: "corr-log-ttl-1",
    intentType: "schedule",
    eventAgeMinutes: 45,
    ttlPolicy: "120m",
    ttlLimitUtc: "2026-02-10T12:00:00Z",
    terminalState: TERMINAL_STATES.TTL_VALID_READY_FOR_REPLAY,
    reason: "ttl_valid",
  });

  assert.deepEqual(Object.keys(auditLog), [
    "correlation_id",
    "intent",
    "event_age_minutes",
    "ttl_policy",
    "ttl_limit_utc",
    "result",
    "reason",
  ]);
  assert.equal(auditLog.intent, "schedule");
  assert.equal(auditLog.event_age_minutes, 45);
  assert.equal(auditLog.ttl_policy, "120m");
});
