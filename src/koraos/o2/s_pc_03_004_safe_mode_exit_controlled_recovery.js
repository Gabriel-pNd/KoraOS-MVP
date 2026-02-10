export const TERMINAL_STATES = Object.freeze({
  SAFE_MODE_EXIT_COMPLETED: "safe_mode_exit_completed",
  SAFE_MODE_EXIT_DENIED_MISSING_CHECKLIST: "safe_mode_exit_denied_missing_checklist",
  SAFE_MODE_EXIT_ABORTED_HEALTH_UNSTABLE: "safe_mode_exit_aborted_health_unstable",
});

export const RECOVERY_WINDOW_MINUTES = 10;

export async function evaluateSafeModeExit({
  safeModeActive,
  ackId,
  recoveryAction,
  checklist = {},
  healthChecks = [],
  runtime = {
    safeModeActive: true,
    blockedSideEffects: ["schedule", "reschedule", "cancel"],
    unlockedSideEffects: [],
  },
  unlockSideEffectsControlled = async ({ runtimeRef }) => {
    runtimeRef.safeModeActive = false;
    runtimeRef.unlockedSideEffects = ["schedule", "reschedule", "cancel"];
    return { unlocked: true };
  },
}) {
  if (!safeModeActive || !runtime.safeModeActive) {
    return buildResult({
      terminalState: TERMINAL_STATES.SAFE_MODE_EXIT_DENIED_MISSING_CHECKLIST,
      reason: "safe_mode_not_active",
      ackId,
      recoveryAction,
      checklist,
      healthWindowMinutes: RECOVERY_WINDOW_MINUTES,
      runtime,
    });
  }

  if (!ackId || !recoveryAction || !isChecklistComplete(checklist)) {
    return buildResult({
      terminalState: TERMINAL_STATES.SAFE_MODE_EXIT_DENIED_MISSING_CHECKLIST,
      reason: "missing_checklist_or_ack",
      ackId,
      recoveryAction,
      checklist,
      healthWindowMinutes: RECOVERY_WINDOW_MINUTES,
      runtime,
    });
  }

  const healthWindow = computeHealthWindow(healthChecks);
  if (!healthWindow.windowIsStable || healthWindow.windowMinutes < RECOVERY_WINDOW_MINUTES) {
    runtime.safeModeActive = true;
    return buildResult({
      terminalState: TERMINAL_STATES.SAFE_MODE_EXIT_ABORTED_HEALTH_UNSTABLE,
      reason: "health_window_unstable",
      ackId,
      recoveryAction,
      checklist,
      healthWindowMinutes: healthWindow.windowMinutes,
      runtime,
    });
  }

  await unlockSideEffectsControlled({ runtimeRef: runtime });
  runtime.safeModeActive = false;
  return buildResult({
    terminalState: TERMINAL_STATES.SAFE_MODE_EXIT_COMPLETED,
    reason: "safe_mode_exit_completed",
    ackId,
    recoveryAction,
    checklist,
    healthWindowMinutes: healthWindow.windowMinutes,
    runtime,
  });
}

export function buildSafeModeExitAuditLog({
  ackId,
  recoveryAction,
  healthWindowMinutes,
  terminalState,
  reason,
  checklistComplete,
}) {
  return {
    ack_id: ackId || null,
    recovery_action: recoveryAction || null,
    health_window: healthWindowMinutes == null ? null : healthWindowMinutes,
    terminal_state: terminalState,
    reason: reason || null,
    checklist_complete: Boolean(checklistComplete),
  };
}

export function computeHealthWindow(healthChecks = []) {
  if (!Array.isArray(healthChecks) || healthChecks.length === 0) {
    return { windowIsStable: false, windowMinutes: 0 };
  }

  const sortedChecks = [...healthChecks]
    .map((entry) => ({
      ts: Date.parse(entry.ts),
      healthy: entry.healthy === true,
    }))
    .filter((entry) => Number.isFinite(entry.ts))
    .sort((left, right) => left.ts - right.ts);

  if (!sortedChecks.length) {
    return { windowIsStable: false, windowMinutes: 0 };
  }

  const allHealthy = sortedChecks.every((entry) => entry.healthy);
  const firstTs = sortedChecks[0].ts;
  const lastTs = sortedChecks[sortedChecks.length - 1].ts;
  const windowMinutes = Math.floor((lastTs - firstTs) / 60_000);

  return {
    windowIsStable: allHealthy,
    windowMinutes,
  };
}

function buildResult({
  terminalState,
  reason,
  ackId,
  recoveryAction,
  checklist,
  healthWindowMinutes,
  runtime,
}) {
  return {
    terminalState,
    reason,
    runtimeState: {
      safeModeActive: runtime.safeModeActive,
      blockedSideEffects: [...(runtime.blockedSideEffects || [])],
      unlockedSideEffects: [...(runtime.unlockedSideEffects || [])],
    },
    auditLog: buildSafeModeExitAuditLog({
      ackId,
      recoveryAction,
      healthWindowMinutes,
      terminalState,
      reason,
      checklistComplete: isChecklistComplete(checklist),
    }),
  };
}

function isChecklistComplete(checklist) {
  return Boolean(
    checklist &&
      checklist.ackValidated === true &&
      checklist.recoveryActionLogged === true &&
      checklist.opsNotified === true
  );
}
