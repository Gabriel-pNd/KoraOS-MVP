import test from "node:test";
import assert from "node:assert/strict";

import {
  CausalCommitCoordinator,
  InMemoryLockBackend,
  LockStoreWithFallback,
  TERMINAL_STATES,
  buildCommitAuditLog,
} from "../../src/koraos/o1/s_pc_01_002_causal_commit_by_contact.js";

function createCoordinator({ redisAvailable = true } = {}) {
  const redis = new InMemoryLockBackend("redis", { available: redisAvailable });
  const db = new InMemoryLockBackend("db", { available: true });
  const lockStore = new LockStoreWithFallback({
    primaryBackend: redis,
    fallbackBackend: db,
  });

  return {
    coordinator: new CausalCommitCoordinator({ lockStore }),
    redis,
    db,
  };
}

test("S-PC-01-002: concurrent intents commit in strict causal order", () => {
  const { coordinator } = createCoordinator();

  const intent1 = coordinator.registerIntent({
    contactId: "contact-1",
    intentId: "intent-1",
    correlationId: "corr-intent-1",
  });
  const intent2 = coordinator.registerIntent({
    contactId: "contact-1",
    intentId: "intent-2",
    correlationId: "corr-intent-2",
  });
  const intent3 = coordinator.registerIntent({
    contactId: "contact-1",
    intentId: "intent-3",
    correlationId: "corr-intent-3",
  });

  const firstCommit = coordinator.tryCommit({
    contactId: "contact-1",
    commitSequence: intent1.commitSequence,
    correlationId: "corr-commit-1",
  });
  const thirdBeforeSecond = coordinator.tryCommit({
    contactId: "contact-1",
    commitSequence: intent3.commitSequence,
    correlationId: "corr-commit-3-before-2",
  });
  const secondCommit = coordinator.tryCommit({
    contactId: "contact-1",
    commitSequence: intent2.commitSequence,
    correlationId: "corr-commit-2",
  });
  const thirdAfterSecond = coordinator.tryCommit({
    contactId: "contact-1",
    commitSequence: intent3.commitSequence,
    correlationId: "corr-commit-3-after-2",
  });

  assert.equal(firstCommit.terminalState, TERMINAL_STATES.COMMITTED_CAUSAL);
  assert.equal(
    thirdBeforeSecond.terminalState,
    TERMINAL_STATES.WAITING_PREVIOUS_COMMIT
  );
  assert.equal(secondCommit.terminalState, TERMINAL_STATES.COMMITTED_CAUSAL);
  assert.equal(thirdAfterSecond.terminalState, TERMINAL_STATES.COMMITTED_CAUSAL);
  assert.equal(coordinator.getLastCommittedSequence("contact-1"), 3);
});

test("S-PC-01-002: stale sequence is blocked as conflict", () => {
  const { coordinator } = createCoordinator();

  const intent1 = coordinator.registerIntent({
    contactId: "contact-2",
    intentId: "intent-1",
    correlationId: "corr-1",
  });

  const firstCommit = coordinator.tryCommit({
    contactId: "contact-2",
    commitSequence: intent1.commitSequence,
    correlationId: "corr-commit-1",
  });
  const staleCommit = coordinator.tryCommit({
    contactId: "contact-2",
    commitSequence: intent1.commitSequence,
    correlationId: "corr-stale",
  });

  assert.equal(firstCommit.terminalState, TERMINAL_STATES.COMMITTED_CAUSAL);
  assert.equal(staleCommit.terminalState, TERMINAL_STATES.BLOCKED_CONFLICT);
  assert.equal(staleCommit.reason, "stale_sequence");
});

test("S-PC-01-002: redis failure falls back to db lock backend", () => {
  const { coordinator } = createCoordinator({ redisAvailable: false });

  const intent = coordinator.registerIntent({
    contactId: "contact-fallback",
    intentId: "intent-fallback",
    correlationId: "corr-fallback",
  });

  const commitResult = coordinator.tryCommit({
    contactId: "contact-fallback",
    commitSequence: intent.commitSequence,
    correlationId: "corr-commit-fallback",
  });

  assert.equal(commitResult.terminalState, TERMINAL_STATES.COMMITTED_CAUSAL);
  assert.equal(commitResult.lockBackend, "db");
});

test("S-PC-01-002: structured logs include causal fields", () => {
  const auditLog = buildCommitAuditLog({
    contactId: "contact-log-1",
    commitSequence: 8,
    terminalState: TERMINAL_STATES.COMMITTED_CAUSAL,
    lockBackend: "redis",
    correlationId: "corr-log-1",
    reason: "causal_commit_applied",
  });

  assert.deepEqual(Object.keys(auditLog), [
    "contact_id",
    "commit_sequence",
    "terminal_state",
    "lock_backend",
    "correlation_id",
    "reason",
  ]);
  assert.equal(auditLog.contact_id, "contact-log-1");
  assert.equal(auditLog.commit_sequence, 8);
  assert.equal(auditLog.lock_backend, "redis");
});
