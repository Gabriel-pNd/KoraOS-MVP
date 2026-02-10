export const TERMINAL_STATES = Object.freeze({
  LOCK_ACQUIRED_PRIMARY: "lock_acquired_primary",
  LOCK_ACQUIRED_FALLBACK: "lock_acquired_fallback",
  LOCK_ACQUIRE_FAILED_SAFE_BLOCK: "lock_acquire_failed_safe_block",
});

export class InMemoryLockBackend {
  constructor(name, options = {}) {
    this.name = name;
    this.available = options.available !== false;
    this.storage = new Map();
  }

  setAvailability(available) {
    this.available = Boolean(available);
  }

  acquire({ lockKey, idempotencyKey }) {
    if (!this.available) {
      const error = new Error(`${this.name}_unavailable`);
      error.code = "BACKEND_UNAVAILABLE";
      throw error;
    }

    if (this.storage.has(idempotencyKey)) {
      return { lockAcquired: true, duplicate: true, mode: this.name };
    }

    if (this.storage.has(lockKey)) {
      const error = new Error(`${this.name}_lock_contended`);
      error.code = "LOCK_CONTENDED";
      throw error;
    }

    this.storage.set(lockKey, idempotencyKey);
    this.storage.set(idempotencyKey, lockKey);
    return { lockAcquired: true, duplicate: false, mode: this.name };
  }
}

export async function acquireLockWithFallback({
  lockKey,
  idempotencyKey,
  correlationId,
  primaryBackend,
  fallbackBackend,
  createCriticalIncident = async () => ({ incidentId: "incident-lock-1" }),
}) {
  const startedAt = Date.now();
  try {
    const primaryResult = primaryBackend.acquire({ lockKey, idempotencyKey });
    return buildResult({
      terminalState: TERMINAL_STATES.LOCK_ACQUIRED_PRIMARY,
      mode: "primary",
      backend: primaryBackend.name,
      duplicate: primaryResult.duplicate,
      correlationId,
      lockLatencyMs: Date.now() - startedAt,
      incidentId: null,
    });
  } catch (primaryError) {
    if (!isBackendUnavailable(primaryError)) {
      return buildResult({
        terminalState: TERMINAL_STATES.LOCK_ACQUIRE_FAILED_SAFE_BLOCK,
        mode: "failed",
        backend: primaryBackend.name,
        duplicate: false,
        correlationId,
        lockLatencyMs: Date.now() - startedAt,
        incidentId: null,
      });
    }
  }

  try {
    const fallbackResult = fallbackBackend.acquire({ lockKey, idempotencyKey });
    return buildResult({
      terminalState: TERMINAL_STATES.LOCK_ACQUIRED_FALLBACK,
      mode: "fallback",
      backend: fallbackBackend.name,
      duplicate: fallbackResult.duplicate,
      correlationId,
      lockLatencyMs: Date.now() - startedAt,
      incidentId: null,
    });
  } catch (_fallbackError) {
    const incident = await createCriticalIncident({
      reason: "redis_and_db_lock_failure",
      correlationId,
      lockKey,
    });

    return buildResult({
      terminalState: TERMINAL_STATES.LOCK_ACQUIRE_FAILED_SAFE_BLOCK,
      mode: "failed",
      backend: "none",
      duplicate: false,
      correlationId,
      lockLatencyMs: Date.now() - startedAt,
      incidentId: incident && incident.incidentId ? incident.incidentId : null,
    });
  }
}

export function buildLockOperationLog({
  correlationId,
  mode,
  backend,
  terminalState,
  duplicate,
  lockLatencyMs,
}) {
  return {
    correlation_id: correlationId || null,
    mode: mode || null,
    backend: backend || null,
    terminal_state: terminalState,
    duplicate: Boolean(duplicate),
    lock_latency_ms: lockLatencyMs == null ? null : lockLatencyMs,
  };
}

export function buildLockModeReport(results = []) {
  const report = {
    totals: {
      lock_acquired_primary: 0,
      lock_acquired_fallback: 0,
      lock_acquire_failed_safe_block: 0,
    },
    fallback_rate_percent: 0,
    lock_latency_p95_ms: 0,
  };

  const latencies = [];
  for (const result of results) {
    if (!result || !result.terminalState || report.totals[result.terminalState] == null) {
      continue;
    }
    report.totals[result.terminalState] += 1;
    if (Number.isFinite(result.lockLatencyMs)) {
      latencies.push(result.lockLatencyMs);
    }
  }

  const total =
    report.totals.lock_acquired_primary +
    report.totals.lock_acquired_fallback +
    report.totals.lock_acquire_failed_safe_block;
  report.fallback_rate_percent =
    total > 0
      ? Number(((report.totals.lock_acquired_fallback / total) * 100).toFixed(2))
      : 0;
  report.lock_latency_p95_ms = percentile95(latencies);
  return report;
}

function buildResult({
  terminalState,
  mode,
  backend,
  duplicate,
  correlationId,
  lockLatencyMs,
  incidentId,
}) {
  return {
    terminalState,
    mode,
    backend,
    duplicate,
    correlationId,
    lockLatencyMs,
    incidentId,
    auditLog: buildLockOperationLog({
      correlationId,
      mode,
      backend,
      terminalState,
      duplicate,
      lockLatencyMs,
    }),
  };
}

function isBackendUnavailable(error) {
  return Boolean(error && error.code === "BACKEND_UNAVAILABLE");
}

function percentile95(values) {
  if (!values.length) {
    return 0;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil(sorted.length * 0.95) - 1;
  return sorted[Math.max(0, index)];
}
