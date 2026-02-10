import test from "node:test";
import assert from "node:assert/strict";

import {
  IdempotencyStoreWithFallback,
  IdempotentCommandProcessor,
  InMemoryIdempotencyBackend,
  PersistenceError,
  TERMINAL_STATES,
  buildIdempotencyAuditLog,
  buildIdempotencyKey,
} from "../../src/koraos/o1/s_pc_01_003_idempotency_version_guard.js";

function createProcessor({ primaryAvailable = true } = {}) {
  const redis = new InMemoryIdempotencyBackend("redis", { available: primaryAvailable });
  const db = new InMemoryIdempotencyBackend("db", { available: true });
  const idempotencyStore = new IdempotencyStoreWithFallback({
    primaryBackend: redis,
    fallbackBackend: db,
  });

  return {
    processor: new IdempotentCommandProcessor({ idempotencyStore, retryLimit: 3 }),
    redis,
    db,
  };
}

function createCommand(overrides = {}) {
  return {
    tenantId: "tenant-1",
    contactId: "contact-1",
    commandType: "schedule",
    commandFingerprint: "appointment-2026-02-11T10:00:00Z",
    versionGuard: 7,
    correlationId: "corr-command-1",
    ...overrides,
  };
}

test("S-PC-01-003: duplicate command is ignored after first apply", async () => {
  const { processor } = createProcessor();
  const command = createCommand();
  let sideEffectCalls = 0;

  const firstRun = await processor.execute({
    command,
    currentVersion: 7,
    applySideEffect: async () => {
      sideEffectCalls += 1;
    },
  });
  const secondRun = await processor.execute({
    command,
    currentVersion: 7,
    applySideEffect: async () => {
      sideEffectCalls += 1;
    },
  });

  assert.equal(firstRun.terminalState, TERMINAL_STATES.APPLIED_ONCE);
  assert.equal(secondRun.terminalState, TERMINAL_STATES.DUPLICATE_IGNORED);
  assert.equal(sideEffectCalls, 1);
});

test("S-PC-01-003: version mismatch blocks side-effect", async () => {
  const { processor } = createProcessor();
  const command = createCommand({ versionGuard: 5 });
  let sideEffectCalls = 0;

  const result = await processor.execute({
    command,
    currentVersion: 7,
    applySideEffect: async () => {
      sideEffectCalls += 1;
    },
  });

  assert.equal(result.terminalState, TERMINAL_STATES.VERSION_CONFLICT_BLOCKED);
  assert.equal(result.reason, "version_guard_mismatch");
  assert.equal(sideEffectCalls, 0);
});

test("S-PC-01-003: idempotency backend falls back from redis to db", async () => {
  const { processor } = createProcessor({ primaryAvailable: false });
  const command = createCommand({ commandFingerprint: "fallback-case" });

  const result = await processor.execute({
    command,
    currentVersion: 7,
    applySideEffect: async () => {},
  });

  assert.equal(result.terminalState, TERMINAL_STATES.APPLIED_ONCE);
  assert.equal(result.idempotencyBackend, "db");
});

test("S-PC-01-003: persistence retry applies once without duplication", async () => {
  const { processor } = createProcessor();
  const command = createCommand({ commandFingerprint: "retry-case" });
  let sideEffectCalls = 0;

  const result = await processor.execute({
    command,
    currentVersion: 7,
    applySideEffect: async () => {
      sideEffectCalls += 1;
      if (sideEffectCalls === 1) {
        throw new PersistenceError("transient persistence error");
      }
    },
  });

  assert.equal(result.terminalState, TERMINAL_STATES.APPLIED_ONCE);
  assert.equal(result.attempts, 2);
  assert.equal(sideEffectCalls, 2);
});

test("S-PC-01-003: structured logs include idempotency and version fields", () => {
  const command = createCommand();
  const idempotencyKey = buildIdempotencyKey(command);
  const auditLog = buildIdempotencyAuditLog({
    correlationId: command.correlationId,
    idempotencyKey,
    versionGuard: command.versionGuard,
    currentVersion: 7,
    terminalState: TERMINAL_STATES.APPLIED_ONCE,
    idempotencyBackend: "redis",
    reason: "side_effect_applied",
    attempts: 1,
  });

  assert.deepEqual(Object.keys(auditLog), [
    "correlation_id",
    "idempotency_key",
    "version_guard",
    "current_version",
    "terminal_state",
    "idempotency_backend",
    "reason",
    "attempts",
  ]);
  assert.equal(auditLog.idempotency_key, idempotencyKey);
  assert.equal(auditLog.version_guard, 7);
  assert.equal(auditLog.current_version, 7);
});
