export const TERMINAL_STATES = Object.freeze({
  DRILL_PASSED_CONTROLLED_CONTINUITY: "drill_passed_controlled_continuity",
  DRILL_PASSED_WITH_WARNINGS: "drill_passed_with_warnings",
  DRILL_FAILED_SIDE_EFFECT_RISK: "drill_failed_side_effect_risk",
});

export async function runRedisFailureDrill({
  correlationId,
  forceRedisFailure = async () => ({ detectionTimeMs: 1_000 }),
  activateFallback = async () => ({ fallbackActivationTimeMs: 1_500 }),
  simulateFallbackOperations = async () => ({
    invalidSideEffectCount: 0,
    processedOperations: 10,
    fallbackLatencyP95Ms: 900,
  }),
  restorePrimary = async () => ({ recoveryTimeMs: 8 * 60_000 }),
}) {
  const phaseTimings = {
    detectionTimeMs: null,
    fallbackActivationTimeMs: null,
    recoveryTimeMs: null,
  };

  const safety = {
    invalidSideEffectCount: 0,
    processedOperations: 0,
    fallbackLatencyP95Ms: 0,
  };

  try {
    const detection = await forceRedisFailure();
    phaseTimings.detectionTimeMs = normalizeDuration(detection && detection.detectionTimeMs);

    const fallback = await activateFallback();
    phaseTimings.fallbackActivationTimeMs = normalizeDuration(
      fallback && fallback.fallbackActivationTimeMs
    );

    const continuity = await simulateFallbackOperations();
    safety.invalidSideEffectCount = normalizeInt(continuity && continuity.invalidSideEffectCount);
    safety.processedOperations = normalizeInt(continuity && continuity.processedOperations);
    safety.fallbackLatencyP95Ms = normalizeDuration(continuity && continuity.fallbackLatencyP95Ms);

    const restore = await restorePrimary();
    phaseTimings.recoveryTimeMs = normalizeDuration(restore && restore.recoveryTimeMs);
  } catch (_error) {
    return buildResult({
      terminalState: TERMINAL_STATES.DRILL_FAILED_SIDE_EFFECT_RISK,
      reason: "drill_execution_failure",
      correlationId,
      phaseTimings,
      safety,
      warnings: ["drill_execution_failure"],
    });
  }

  const warnings = [];
  if (phaseTimings.recoveryTimeMs > 10 * 60_000) {
    warnings.push("fallback_recovery_time_above_10m");
  }
  if (safety.fallbackLatencyP95Ms > 1_200) {
    warnings.push("fallback_db_lock_latency_p95_above_1200ms");
  }

  if (safety.invalidSideEffectCount > 0) {
    return buildResult({
      terminalState: TERMINAL_STATES.DRILL_FAILED_SIDE_EFFECT_RISK,
      reason: "invalid_side_effect_detected",
      correlationId,
      phaseTimings,
      safety,
      warnings,
    });
  }

  if (warnings.length > 0) {
    return buildResult({
      terminalState: TERMINAL_STATES.DRILL_PASSED_WITH_WARNINGS,
      reason: "controlled_continuity_with_warnings",
      correlationId,
      phaseTimings,
      safety,
      warnings,
    });
  }

  return buildResult({
    terminalState: TERMINAL_STATES.DRILL_PASSED_CONTROLLED_CONTINUITY,
    reason: "controlled_continuity_validated",
    correlationId,
    phaseTimings,
    safety,
    warnings,
  });
}

export function buildRedisFailureDrillReport(drillResults = []) {
  const report = {
    totals: {
      drill_passed_controlled_continuity: 0,
      drill_passed_with_warnings: 0,
      drill_failed_side_effect_risk: 0,
    },
    detection_time_p95_ms: 0,
    fallback_activation_time_p95_ms: 0,
    recovery_time_p95_ms: 0,
    invalid_side_effect_count: 0,
  };

  const detectionTimes = [];
  const fallbackTimes = [];
  const recoveryTimes = [];

  for (const result of drillResults) {
    if (!result || !result.terminalState || report.totals[result.terminalState] == null) {
      continue;
    }
    report.totals[result.terminalState] += 1;

    if (Number.isFinite(result.phaseTimings && result.phaseTimings.detectionTimeMs)) {
      detectionTimes.push(result.phaseTimings.detectionTimeMs);
    }
    if (Number.isFinite(result.phaseTimings && result.phaseTimings.fallbackActivationTimeMs)) {
      fallbackTimes.push(result.phaseTimings.fallbackActivationTimeMs);
    }
    if (Number.isFinite(result.phaseTimings && result.phaseTimings.recoveryTimeMs)) {
      recoveryTimes.push(result.phaseTimings.recoveryTimeMs);
    }
    report.invalid_side_effect_count += normalizeInt(
      result.safety && result.safety.invalidSideEffectCount
    );
  }

  report.detection_time_p95_ms = percentile95(detectionTimes);
  report.fallback_activation_time_p95_ms = percentile95(fallbackTimes);
  report.recovery_time_p95_ms = percentile95(recoveryTimes);
  return report;
}

function buildResult({
  terminalState,
  reason,
  correlationId,
  phaseTimings,
  safety,
  warnings,
}) {
  return {
    terminalState,
    reason,
    correlationId,
    phaseTimings,
    safety,
    warnings,
  };
}

function normalizeDuration(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function normalizeInt(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
}

function percentile95(values) {
  if (!values.length) {
    return 0;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil(sorted.length * 0.95) - 1;
  return sorted[Math.max(0, index)];
}
