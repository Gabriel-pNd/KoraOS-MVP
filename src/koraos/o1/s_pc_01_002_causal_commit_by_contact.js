export const TERMINAL_STATES = Object.freeze({
  COMMITTED_CAUSAL: "committed_causal",
  WAITING_PREVIOUS_COMMIT: "waiting_previous_commit",
  BLOCKED_CONFLICT: "blocked_conflict",
});

export class InMemoryLockBackend {
  constructor(name, options = {}) {
    this.name = name;
    this.available = options.available !== false;
    this.activeLocks = new Map();
    this.counter = 0;
  }

  setAvailability(available) {
    this.available = Boolean(available);
  }

  acquire(contactId) {
    if (!this.available) {
      const error = new Error(`${this.name}_unavailable`);
      error.code = "BACKEND_UNAVAILABLE";
      throw error;
    }

    if (this.activeLocks.has(contactId)) {
      const error = new Error(`${this.name}_lock_contended`);
      error.code = "LOCK_CONTENDED";
      throw error;
    }

    this.counter += 1;
    const token = `${this.name}:${contactId}:${this.counter}`;
    this.activeLocks.set(contactId, token);
    return token;
  }

  release(contactId, token) {
    const activeToken = this.activeLocks.get(contactId);
    if (activeToken === token) {
      this.activeLocks.delete(contactId);
    }
  }
}

export class LockStoreWithFallback {
  constructor({ primaryBackend, fallbackBackend }) {
    if (!primaryBackend || !fallbackBackend) {
      throw new Error("Both primaryBackend and fallbackBackend are required.");
    }

    this.primaryBackend = primaryBackend;
    this.fallbackBackend = fallbackBackend;
  }

  acquire(contactId) {
    try {
      const token = this.primaryBackend.acquire(contactId);
      return {
        backendName: this.primaryBackend.name,
        backendSlot: "primary",
        token,
      };
    } catch (error) {
      if (error && error.code !== "BACKEND_UNAVAILABLE") {
        throw error;
      }

      const token = this.fallbackBackend.acquire(contactId);
      return {
        backendName: this.fallbackBackend.name,
        backendSlot: "fallback",
        token,
      };
    }
  }

  release(contactId, lockHandle) {
    if (!lockHandle) {
      return;
    }

    const targetBackend =
      lockHandle.backendSlot === "primary" ? this.primaryBackend : this.fallbackBackend;
    targetBackend.release(contactId, lockHandle.token);
  }
}

export class CausalCommitCoordinator {
  constructor({ lockStore }) {
    if (!lockStore) {
      throw new Error("lockStore is required.");
    }

    this.lockStore = lockStore;
    this.nextSequenceByContact = new Map();
    this.lastCommittedByContact = new Map();
  }

  registerIntent({ contactId, intentId, correlationId }) {
    if (typeof contactId !== "string" || contactId.trim() === "") {
      throw new Error("contactId is required.");
    }

    const nextSequence = Number(this.nextSequenceByContact.get(contactId) || 1);
    this.nextSequenceByContact.set(contactId, nextSequence + 1);

    return {
      intentId: intentId || `${contactId}:${nextSequence}`,
      contactId,
      commitSequence: nextSequence,
      correlationId: correlationId || null,
    };
  }

  tryCommit({ contactId, commitSequence, correlationId }) {
    if (
      typeof contactId !== "string" ||
      contactId.trim() === "" ||
      !Number.isInteger(commitSequence) ||
      commitSequence <= 0
    ) {
      return buildResult({
        contactId,
        commitSequence,
        correlationId,
        lockBackend: null,
        terminalState: TERMINAL_STATES.BLOCKED_CONFLICT,
        reason: "invalid_payload",
      });
    }

    let lockHandle = null;
    try {
      lockHandle = this.lockStore.acquire(contactId);
    } catch (_error) {
      return buildResult({
        contactId,
        commitSequence,
        correlationId,
        lockBackend: null,
        terminalState: TERMINAL_STATES.BLOCKED_CONFLICT,
        reason: "lock_unavailable",
      });
    }

    try {
      const lastCommitted = Number(this.lastCommittedByContact.get(contactId) || 0);
      const expectedSequence = lastCommitted + 1;

      if (commitSequence < expectedSequence) {
        return buildResult({
          contactId,
          commitSequence,
          correlationId,
          lockBackend: lockHandle.backendName,
          terminalState: TERMINAL_STATES.BLOCKED_CONFLICT,
          reason: "stale_sequence",
        });
      }

      if (commitSequence > expectedSequence) {
        return buildResult({
          contactId,
          commitSequence,
          correlationId,
          lockBackend: lockHandle.backendName,
          terminalState: TERMINAL_STATES.WAITING_PREVIOUS_COMMIT,
          reason: "previous_sequence_pending",
        });
      }

      this.lastCommittedByContact.set(contactId, commitSequence);
      return buildResult({
        contactId,
        commitSequence,
        correlationId,
        lockBackend: lockHandle.backendName,
        terminalState: TERMINAL_STATES.COMMITTED_CAUSAL,
        reason: "causal_commit_applied",
      });
    } finally {
      this.lockStore.release(contactId, lockHandle);
    }
  }

  getLastCommittedSequence(contactId) {
    return Number(this.lastCommittedByContact.get(contactId) || 0);
  }
}

export function buildCommitAuditLog({
  contactId,
  commitSequence,
  terminalState,
  lockBackend,
  correlationId,
  reason,
}) {
  return {
    contact_id: contactId || null,
    commit_sequence: commitSequence == null ? null : commitSequence,
    terminal_state: terminalState,
    lock_backend: lockBackend || null,
    correlation_id: correlationId || null,
    reason: reason || null,
  };
}

function buildResult({
  contactId,
  commitSequence,
  correlationId,
  lockBackend,
  terminalState,
  reason,
}) {
  return {
    terminalState,
    reason,
    lockBackend: lockBackend || null,
    auditLog: buildCommitAuditLog({
      contactId,
      commitSequence,
      terminalState,
      lockBackend,
      correlationId,
      reason,
    }),
  };
}
