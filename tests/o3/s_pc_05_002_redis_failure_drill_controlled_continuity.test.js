import test from "node:test";
import assert from "node:assert/strict";

import {
  TERMINAL_STATES,
  buildRedisFailureDrillReport,
  runRedisFailureDrill,
} from "../../src/koraos/o3/s_pc_05_002_redis_failure_drill_controlled_continuity.js";

test("S-PC-05-002: drill forces Redis failure and activates fallback automatically", async () => {
  const result = await runRedisFailureDrill({
    correlationId: "corr-drill-1",
    forceRedisFailure: async () => ({ detectionTimeMs: 2_000 }),
    activateFallback: async () => ({ fallbackActivationTimeMs: 3_000 }),
    simulateFallbackOperations: async () => ({
      invalidSideEffectCount: 0,
      processedOperations: 12,
      fallbackLatencyP95Ms: 1_000,
    }),
    restorePrimary: async () => ({ recoveryTimeMs: 7 * 60_000 }),
  });

  assert.equal(result.terminalState, TERMINAL_STATES.DRILL_PASSED_CONTROLLED_CONTINUITY);
  assert.equal(result.phaseTimings.detectionTimeMs, 2_000);
  assert.equal(result.phaseTimings.fallbackActivationTimeMs, 3_000);
});

test("S-PC-05-002: no invalid side-effects during fallback", async () => {
  const result = await runRedisFailureDrill({
    correlationId: "corr-drill-2",
    simulateFallbackOperations: async () => ({
      invalidSideEffectCount: 0,
      processedOperations: 25,
      fallbackLatencyP95Ms: 950,
    }),
  });

  assert.equal(result.safety.invalidSideEffectCount, 0);
  assert.notEqual(result.terminalState, TERMINAL_STATES.DRILL_FAILED_SIDE_EFFECT_RISK);
});

test("S-PC-05-002: recovery to primary preserves controlled continuity", async () => {
  const result = await runRedisFailureDrill({
    correlationId: "corr-drill-3",
    restorePrimary: async () => ({ recoveryTimeMs: 9 * 60_000 }),
  });

  assert.equal(result.terminalState, TERMINAL_STATES.DRILL_PASSED_CONTROLLED_CONTINUITY);
  assert.ok(result.phaseTimings.recoveryTimeMs > 0);
});

test("S-PC-05-002: drill report includes detection fallback and recovery times", () => {
  const report = buildRedisFailureDrillReport([
    {
      terminalState: TERMINAL_STATES.DRILL_PASSED_CONTROLLED_CONTINUITY,
      phaseTimings: {
        detectionTimeMs: 2_000,
        fallbackActivationTimeMs: 3_000,
        recoveryTimeMs: 8 * 60_000,
      },
      safety: { invalidSideEffectCount: 0 },
    },
    {
      terminalState: TERMINAL_STATES.DRILL_PASSED_WITH_WARNINGS,
      phaseTimings: {
        detectionTimeMs: 2_200,
        fallbackActivationTimeMs: 3_200,
        recoveryTimeMs: 11 * 60_000,
      },
      safety: { invalidSideEffectCount: 0 },
    },
  ]);

  assert.equal(report.totals.drill_passed_controlled_continuity, 1);
  assert.equal(report.totals.drill_passed_with_warnings, 1);
  assert.equal(report.detection_time_p95_ms, 2_200);
  assert.equal(report.fallback_activation_time_p95_ms, 3_200);
  assert.equal(report.recovery_time_p95_ms, 11 * 60_000);
  assert.equal(report.invalid_side_effect_count, 0);
});

test("S-PC-05-002: invalid side-effect risk fails the drill", async () => {
  const result = await runRedisFailureDrill({
    correlationId: "corr-drill-4",
    simulateFallbackOperations: async () => ({
      invalidSideEffectCount: 1,
      processedOperations: 12,
      fallbackLatencyP95Ms: 900,
    }),
  });

  assert.equal(result.terminalState, TERMINAL_STATES.DRILL_FAILED_SIDE_EFFECT_RISK);
  assert.equal(result.reason, "invalid_side_effect_detected");
});
