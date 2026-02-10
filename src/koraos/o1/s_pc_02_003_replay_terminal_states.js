import {
  TERMINAL_STATES as REPLAY_TTL_STATES,
} from "./s_pc_02_001_replay_ttl_validation.js";
import {
  TERMINAL_STATES as REPLAY_VERSION_STATES,
} from "./s_pc_02_002_replay_version_asof_validation.js";

export const TERMINAL_STATES = Object.freeze({
  REPLAYED: "replayed",
  EXPIRED_MANUAL: "expired_manual",
  CONFLICT_BLOCKED: "conflict_blocked",
  MANUAL_REVIEW_REQUIRED: "manual_review_required",
});

export async function processReplayTerminalState({
  replayEvent,
  ttlValidationResult,
  versionValidationResult,
  applyReplay,
  createManualTask,
}) {
  const hasReplayExecutor = typeof applyReplay === "function";
  const hasManualTaskCreator = typeof createManualTask === "function";

  if (!hasReplayExecutor || !hasManualTaskCreator) {
    return buildResult({
      replayEvent,
      terminalState: TERMINAL_STATES.MANUAL_REVIEW_REQUIRED,
      reason: "invalid_processor_callbacks",
      manualTaskId: null,
    });
  }

  if (!ttlValidationResult || !versionValidationResult) {
    const manualTask = await createManualTask({
      replayEvent,
      terminalState: TERMINAL_STATES.MANUAL_REVIEW_REQUIRED,
      reason: "missing_validation_result",
    });
    return buildResult({
      replayEvent,
      terminalState: TERMINAL_STATES.MANUAL_REVIEW_REQUIRED,
      reason: "missing_validation_result",
      manualTaskId: manualTask && manualTask.taskId,
    });
  }

  if (ttlValidationResult.terminalState === REPLAY_TTL_STATES.EXPIRED_MANUAL) {
    const manualTask = await createManualTask({
      replayEvent,
      terminalState: TERMINAL_STATES.EXPIRED_MANUAL,
      reason: "ttl_expired",
    });
    return buildResult({
      replayEvent,
      terminalState: TERMINAL_STATES.EXPIRED_MANUAL,
      reason: "ttl_expired",
      manualTaskId: manualTask && manualTask.taskId,
    });
  }

  if (
    ttlValidationResult.terminalState !== REPLAY_TTL_STATES.TTL_VALID_READY_FOR_REPLAY
  ) {
    const manualTask = await createManualTask({
      replayEvent,
      terminalState: TERMINAL_STATES.MANUAL_REVIEW_REQUIRED,
      reason: "invalid_ttl_state",
    });
    return buildResult({
      replayEvent,
      terminalState: TERMINAL_STATES.MANUAL_REVIEW_REQUIRED,
      reason: "invalid_ttl_state",
      manualTaskId: manualTask && manualTask.taskId,
    });
  }

  if (versionValidationResult.terminalState === REPLAY_VERSION_STATES.CONFLICT_BLOCKED) {
    const manualTask = await createManualTask({
      replayEvent,
      terminalState: TERMINAL_STATES.CONFLICT_BLOCKED,
      reason: "version_or_as_of_conflict",
    });
    return buildResult({
      replayEvent,
      terminalState: TERMINAL_STATES.CONFLICT_BLOCKED,
      reason: "version_or_as_of_conflict",
      manualTaskId: manualTask && manualTask.taskId,
    });
  }

  if (
    versionValidationResult.terminalState !==
    REPLAY_VERSION_STATES.VERSION_MATCH_READY_FOR_REPLAY
  ) {
    const manualTask = await createManualTask({
      replayEvent,
      terminalState: TERMINAL_STATES.MANUAL_REVIEW_REQUIRED,
      reason: "invalid_version_state",
    });
    return buildResult({
      replayEvent,
      terminalState: TERMINAL_STATES.MANUAL_REVIEW_REQUIRED,
      reason: "invalid_version_state",
      manualTaskId: manualTask && manualTask.taskId,
    });
  }

  try {
    await applyReplay({ replayEvent });
    return buildResult({
      replayEvent,
      terminalState: TERMINAL_STATES.REPLAYED,
      reason: "replay_applied",
      manualTaskId: null,
    });
  } catch (_error) {
    const manualTask = await createManualTask({
      replayEvent,
      terminalState: TERMINAL_STATES.MANUAL_REVIEW_REQUIRED,
      reason: "unexpected_replay_failure",
    });
    return buildResult({
      replayEvent,
      terminalState: TERMINAL_STATES.MANUAL_REVIEW_REQUIRED,
      reason: "unexpected_replay_failure",
      manualTaskId: manualTask && manualTask.taskId,
    });
  }
}

export function buildReplayTerminalAuditLog({
  eventId,
  correlationId,
  terminalState,
  reason,
  manualTaskId,
}) {
  return {
    event_id: eventId || null,
    correlation_id: correlationId || null,
    terminal_state: terminalState,
    reason: reason || null,
    manual_task_id: manualTaskId || null,
  };
}

export function buildReplayStatusReport(processingResults = []) {
  const initialReport = {
    totals: {
      replayed: 0,
      expired_manual: 0,
      conflict_blocked: 0,
      manual_review_required: 0,
    },
    by_status: {
      replayed: [],
      expired_manual: [],
      conflict_blocked: [],
      manual_review_required: [],
    },
  };

  return processingResults.reduce((report, result) => {
    const status = result && result.terminalState;
    if (!status || report.totals[status] == null) {
      return report;
    }

    report.totals[status] += 1;
    report.by_status[status].push({
      event_id: result.eventId || null,
      correlation_id: result.correlationId || null,
    });
    return report;
  }, initialReport);
}

function buildResult({ replayEvent, terminalState, reason, manualTaskId }) {
  return {
    terminalState,
    reason,
    eventId: replayEvent && replayEvent.eventId ? replayEvent.eventId : null,
    correlationId:
      replayEvent && replayEvent.correlationId ? replayEvent.correlationId : null,
    manualTaskId: manualTaskId || null,
    auditLog: buildReplayTerminalAuditLog({
      eventId: replayEvent && replayEvent.eventId,
      correlationId: replayEvent && replayEvent.correlationId,
      terminalState,
      reason,
      manualTaskId,
    }),
  };
}
