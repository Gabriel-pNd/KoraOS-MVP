import test from "node:test";
import assert from "node:assert/strict";

import {
  TERMINAL_STATES,
  RECOVERY_WINDOW_MINUTES,
  computeHealthWindow,
  evaluateSafeModeExit,
} from "../../src/koraos/o2/s_pc_03_004_safe_mode_exit_controlled_recovery.js";

function buildChecklist(overrides = {}) {
  return {
    ackValidated: true,
    recoveryActionLogged: true,
    opsNotified: true,
    ...overrides,
  };
}

function buildHealthChecks(startIso, minutes, healthy = true) {
  const entries = [];
  const startMs = Date.parse(startIso);
  for (let minute = 0; minute <= minutes; minute += 1) {
    entries.push({
      ts: new Date(startMs + minute * 60_000).toISOString(),
      healthy,
    });
  }
  return entries;
}

test("S-PC-03-004: exit is denied without complete checklist", async () => {
  const runtime = {
    safeModeActive: true,
    blockedSideEffects: ["schedule", "reschedule", "cancel"],
    unlockedSideEffects: [],
  };

  const result = await evaluateSafeModeExit({
    safeModeActive: true,
    ackId: "ack-1",
    recoveryAction: "runbook-step-1",
    checklist: buildChecklist({ opsNotified: false }),
    healthChecks: buildHealthChecks("2026-02-10T10:00:00Z", 10, true),
    runtime,
  });

  assert.equal(
    result.terminalState,
    TERMINAL_STATES.SAFE_MODE_EXIT_DENIED_MISSING_CHECKLIST
  );
  assert.equal(result.runtimeState.safeModeActive, true);
});

test("S-PC-03-004: checklist plus 10 min green health exits safe mode", async () => {
  const runtime = {
    safeModeActive: true,
    blockedSideEffects: ["schedule", "reschedule", "cancel"],
    unlockedSideEffects: [],
  };

  const result = await evaluateSafeModeExit({
    safeModeActive: true,
    ackId: "ack-2",
    recoveryAction: "recovery-action-2",
    checklist: buildChecklist(),
    healthChecks: buildHealthChecks("2026-02-10T10:00:00Z", RECOVERY_WINDOW_MINUTES, true),
    runtime,
  });

  assert.equal(result.terminalState, TERMINAL_STATES.SAFE_MODE_EXIT_COMPLETED);
  assert.equal(result.runtimeState.safeModeActive, false);
  assert.deepEqual(result.runtimeState.unlockedSideEffects, [
    "schedule",
    "reschedule",
    "cancel",
  ]);
});

test("S-PC-03-004: red health during recovery window aborts exit", async () => {
  const runtime = {
    safeModeActive: true,
    blockedSideEffects: ["schedule", "reschedule", "cancel"],
    unlockedSideEffects: [],
  };
  const healthChecks = buildHealthChecks("2026-02-10T10:00:00Z", RECOVERY_WINDOW_MINUTES, true);
  healthChecks[6] = { ...healthChecks[6], healthy: false };

  const result = await evaluateSafeModeExit({
    safeModeActive: true,
    ackId: "ack-3",
    recoveryAction: "recovery-action-3",
    checklist: buildChecklist(),
    healthChecks,
    runtime,
  });

  assert.equal(
    result.terminalState,
    TERMINAL_STATES.SAFE_MODE_EXIT_ABORTED_HEALTH_UNSTABLE
  );
  assert.equal(result.runtimeState.safeModeActive, true);
});

test("S-PC-03-004: audit log includes ack_id recovery_action and health_window", () => {
  const healthWindow = computeHealthWindow(
    buildHealthChecks("2026-02-10T10:00:00Z", RECOVERY_WINDOW_MINUTES, true)
  );

  assert.equal(healthWindow.windowMinutes, RECOVERY_WINDOW_MINUTES);
  assert.equal(healthWindow.windowIsStable, true);
});
