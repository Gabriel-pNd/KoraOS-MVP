import test from "node:test";
import assert from "node:assert/strict";

import {
  InMemoryLockBackend,
  TERMINAL_STATES,
  acquireLockWithFallback,
  buildLockModeReport,
} from "../../src/koraos/o2/s_pc_05_001_redis_lock_idempotency_fallback_db.js";

test("S-PC-05-001: normal flow acquires lock on Redis primary", async () => {
  const redis = new InMemoryLockBackend("redis", { available: true });
  const db = new InMemoryLockBackend("db", { available: true });

  const result = await acquireLockWithFallback({
    lockKey: "tenant:1:contact:1",
    idempotencyKey: "idem-1",
    correlationId: "corr-lock-1",
    primaryBackend: redis,
    fallbackBackend: db,
  });

  assert.equal(result.terminalState, TERMINAL_STATES.LOCK_ACQUIRED_PRIMARY);
  assert.equal(result.mode, "primary");
  assert.equal(result.backend, "redis");
});

test("S-PC-05-001: Redis failure activates DB fallback without duplicate effect", async () => {
  const redis = new InMemoryLockBackend("redis", { available: false });
  const db = new InMemoryLockBackend("db", { available: true });

  const firstResult = await acquireLockWithFallback({
    lockKey: "tenant:1:contact:2",
    idempotencyKey: "idem-2",
    correlationId: "corr-lock-2",
    primaryBackend: redis,
    fallbackBackend: db,
  });
  const duplicateResult = await acquireLockWithFallback({
    lockKey: "tenant:1:contact:2",
    idempotencyKey: "idem-2",
    correlationId: "corr-lock-2",
    primaryBackend: redis,
    fallbackBackend: db,
  });

  assert.equal(firstResult.terminalState, TERMINAL_STATES.LOCK_ACQUIRED_FALLBACK);
  assert.equal(duplicateResult.terminalState, TERMINAL_STATES.LOCK_ACQUIRED_FALLBACK);
  assert.equal(duplicateResult.duplicate, true);
});

test("S-PC-05-001: Redis+DB failure blocks side-effect and opens critical incident", async () => {
  const redis = new InMemoryLockBackend("redis", { available: false });
  const db = new InMemoryLockBackend("db", { available: false });

  const result = await acquireLockWithFallback({
    lockKey: "tenant:1:contact:3",
    idempotencyKey: "idem-3",
    correlationId: "corr-lock-3",
    primaryBackend: redis,
    fallbackBackend: db,
    createCriticalIncident: async () => ({ incidentId: "incident-lock-3" }),
  });

  assert.equal(
    result.terminalState,
    TERMINAL_STATES.LOCK_ACQUIRE_FAILED_SAFE_BLOCK
  );
  assert.equal(result.incidentId, "incident-lock-3");
});

test("S-PC-05-001: mode report returns fallback rate and p95 lock latency", () => {
  const report = buildLockModeReport([
    { terminalState: TERMINAL_STATES.LOCK_ACQUIRED_PRIMARY, lockLatencyMs: 100 },
    { terminalState: TERMINAL_STATES.LOCK_ACQUIRED_FALLBACK, lockLatencyMs: 800 },
    { terminalState: TERMINAL_STATES.LOCK_ACQUIRED_FALLBACK, lockLatencyMs: 900 },
    { terminalState: TERMINAL_STATES.LOCK_ACQUIRE_FAILED_SAFE_BLOCK, lockLatencyMs: 1200 },
  ]);

  assert.equal(report.totals.lock_acquired_primary, 1);
  assert.equal(report.totals.lock_acquired_fallback, 2);
  assert.equal(report.totals.lock_acquire_failed_safe_block, 1);
  assert.equal(report.fallback_rate_percent, 50);
  assert.equal(report.lock_latency_p95_ms, 1200);
});
