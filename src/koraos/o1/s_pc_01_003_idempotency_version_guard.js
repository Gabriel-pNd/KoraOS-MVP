export const TERMINAL_STATES = Object.freeze({
  APPLIED_ONCE: "applied_once",
  DUPLICATE_IGNORED: "duplicate_ignored",
  VERSION_CONFLICT_BLOCKED: "version_conflict_blocked",
});

export class PersistenceError extends Error {
  constructor(message) {
    super(message);
    this.name = "PersistenceError";
    this.code = "PERSISTENCE_ERROR";
  }
}

export class InMemoryIdempotencyBackend {
  constructor(name, options = {}) {
    this.name = name;
    this.available = options.available !== false;
    this.keys = new Set();
  }

  setAvailability(available) {
    this.available = Boolean(available);
  }

  has(key) {
    this.assertAvailable();
    return this.keys.has(key);
  }

  mark(key) {
    this.assertAvailable();
    this.keys.add(key);
  }

  assertAvailable() {
    if (!this.available) {
      const error = new Error(`${this.name}_unavailable`);
      error.code = "BACKEND_UNAVAILABLE";
      throw error;
    }
  }
}

export class IdempotencyStoreWithFallback {
  constructor({ primaryBackend, fallbackBackend }) {
    if (!primaryBackend || !fallbackBackend) {
      throw new Error("Both primaryBackend and fallbackBackend are required.");
    }

    this.primaryBackend = primaryBackend;
    this.fallbackBackend = fallbackBackend;
  }

  has(idempotencyKey) {
    try {
      return {
        exists: this.primaryBackend.has(idempotencyKey),
        backend: this.primaryBackend.name,
      };
    } catch (error) {
      if (error && error.code !== "BACKEND_UNAVAILABLE") {
        throw error;
      }

      return {
        exists: this.fallbackBackend.has(idempotencyKey),
        backend: this.fallbackBackend.name,
      };
    }
  }

  mark(idempotencyKey) {
    try {
      this.primaryBackend.mark(idempotencyKey);
      return { backend: this.primaryBackend.name };
    } catch (error) {
      if (error && error.code !== "BACKEND_UNAVAILABLE") {
        throw error;
      }

      this.fallbackBackend.mark(idempotencyKey);
      return { backend: this.fallbackBackend.name };
    }
  }
}

export class IdempotentCommandProcessor {
  constructor({ idempotencyStore, retryLimit = 3 }) {
    if (!idempotencyStore) {
      throw new Error("idempotencyStore is required.");
    }

    this.idempotencyStore = idempotencyStore;
    this.retryLimit = retryLimit;
  }

  async execute({ command, currentVersion, applySideEffect }) {
    if (!command) {
      throw new Error("command is required.");
    }

    if (typeof applySideEffect !== "function") {
      throw new Error("applySideEffect must be a function.");
    }

    const idempotencyKey = command.idempotencyKey || buildIdempotencyKey(command);
    const existingRecord = this.idempotencyStore.has(idempotencyKey);
    if (existingRecord.exists) {
      return buildResult({
        command,
        currentVersion,
        idempotencyKey,
        idempotencyBackend: existingRecord.backend,
        terminalState: TERMINAL_STATES.DUPLICATE_IGNORED,
        reason: "duplicate_command_detected",
        attempts: 0,
      });
    }

    if (command.versionGuard !== currentVersion) {
      return buildResult({
        command,
        currentVersion,
        idempotencyKey,
        idempotencyBackend: existingRecord.backend,
        terminalState: TERMINAL_STATES.VERSION_CONFLICT_BLOCKED,
        reason: "version_guard_mismatch",
        attempts: 0,
      });
    }

    let attempts = 0;
    while (attempts < this.retryLimit) {
      attempts += 1;
      try {
        await applySideEffect({
          command,
          idempotencyKey,
          attempt: attempts,
        });

        const markResult = this.idempotencyStore.mark(idempotencyKey);
        return buildResult({
          command,
          currentVersion,
          idempotencyKey,
          idempotencyBackend: markResult.backend,
          terminalState: TERMINAL_STATES.APPLIED_ONCE,
          reason: "side_effect_applied",
          attempts,
        });
      } catch (error) {
        if (!(error instanceof PersistenceError) || attempts >= this.retryLimit) {
          throw error;
        }
      }
    }

    throw new Error("Unexpected retry loop termination.");
  }
}

export function buildIdempotencyKey(command) {
  const tenant = normalizeToken(command.tenantId, "unknown_tenant");
  const contact = normalizeToken(command.contactId, "unknown_contact");
  const type = normalizeToken(command.commandType, "unknown_command");
  const fingerprint = normalizeToken(
    command.commandFingerprint || command.externalId || command.commandId,
    "unknown_fingerprint"
  );

  return `${tenant}:${contact}:${type}:${fingerprint}`;
}

function normalizeToken(value, fallback) {
  if (value == null) {
    return fallback;
  }

  const normalized = String(value).trim().replace(/[^a-zA-Z0-9_.-]+/g, "_");
  return normalized || fallback;
}

export function buildIdempotencyAuditLog({
  correlationId,
  idempotencyKey,
  versionGuard,
  currentVersion,
  terminalState,
  idempotencyBackend,
  reason,
  attempts,
}) {
  return {
    correlation_id: correlationId || null,
    idempotency_key: idempotencyKey,
    version_guard: versionGuard,
    current_version: currentVersion,
    terminal_state: terminalState,
    idempotency_backend: idempotencyBackend || null,
    reason: reason || null,
    attempts: attempts == null ? null : attempts,
  };
}

function buildResult({
  command,
  currentVersion,
  idempotencyKey,
  idempotencyBackend,
  terminalState,
  reason,
  attempts,
}) {
  return {
    terminalState,
    reason,
    idempotencyKey,
    idempotencyBackend: idempotencyBackend || null,
    attempts,
    auditLog: buildIdempotencyAuditLog({
      correlationId: command && command.correlationId,
      idempotencyKey,
      versionGuard: command && command.versionGuard,
      currentVersion,
      terminalState,
      idempotencyBackend,
      reason,
      attempts,
    }),
  };
}
