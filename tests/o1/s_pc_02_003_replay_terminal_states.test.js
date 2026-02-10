import test from "node:test";
import assert from "node:assert/strict";

import {
  TERMINAL_STATES as TTL_STATES,
} from "../../src/koraos/o1/s_pc_02_001_replay_ttl_validation.js";
import {
  TERMINAL_STATES as VERSION_STATES,
} from "../../src/koraos/o1/s_pc_02_002_replay_version_asof_validation.js";
import {
  TERMINAL_STATES,
  buildReplayStatusReport,
  processReplayTerminalState,
} from "../../src/koraos/o1/s_pc_02_003_replay_terminal_states.js";

function createReplayEvent(overrides = {}) {
  return {
    eventId: "evt-replay-1",
    correlationId: "corr-replay-1",
    intentType: "schedule",
    ...overrides,
  };
}

test("S-PC-02-003: success path returns replayed", async () => {
  let appliedCount = 0;
  let manualTaskCount = 0;

  const result = await processReplayTerminalState({
    replayEvent: createReplayEvent(),
    ttlValidationResult: { terminalState: TTL_STATES.TTL_VALID_READY_FOR_REPLAY },
    versionValidationResult: {
      terminalState: VERSION_STATES.VERSION_MATCH_READY_FOR_REPLAY,
    },
    applyReplay: async () => {
      appliedCount += 1;
    },
    createManualTask: async () => {
      manualTaskCount += 1;
      return { taskId: "task-should-not-be-used" };
    },
  });

  assert.equal(result.terminalState, TERMINAL_STATES.REPLAYED);
  assert.equal(appliedCount, 1);
  assert.equal(manualTaskCount, 0);
});

test("S-PC-02-003: expired replay returns expired_manual and creates manual task", async () => {
  const createdTasks = [];

  const result = await processReplayTerminalState({
    replayEvent: createReplayEvent({
      eventId: "evt-replay-expired",
      correlationId: "corr-replay-expired",
    }),
    ttlValidationResult: { terminalState: TTL_STATES.EXPIRED_MANUAL },
    versionValidationResult: {
      terminalState: VERSION_STATES.VERSION_MATCH_READY_FOR_REPLAY,
    },
    applyReplay: async () => {
      throw new Error("should not run replay");
    },
    createManualTask: async ({ terminalState }) => {
      createdTasks.push(terminalState);
      return { taskId: "task-expired-1" };
    },
  });

  assert.equal(result.terminalState, TERMINAL_STATES.EXPIRED_MANUAL);
  assert.equal(result.manualTaskId, "task-expired-1");
  assert.deepEqual(createdTasks, [TERMINAL_STATES.EXPIRED_MANUAL]);
});

test("S-PC-02-003: conflict replay returns conflict_blocked and creates manual task", async () => {
  const createdTasks = [];

  const result = await processReplayTerminalState({
    replayEvent: createReplayEvent({
      eventId: "evt-replay-conflict",
      correlationId: "corr-replay-conflict",
    }),
    ttlValidationResult: { terminalState: TTL_STATES.TTL_VALID_READY_FOR_REPLAY },
    versionValidationResult: {
      terminalState: VERSION_STATES.CONFLICT_BLOCKED,
    },
    applyReplay: async () => {
      throw new Error("should not run replay");
    },
    createManualTask: async ({ terminalState }) => {
      createdTasks.push(terminalState);
      return { taskId: "task-conflict-1" };
    },
  });

  assert.equal(result.terminalState, TERMINAL_STATES.CONFLICT_BLOCKED);
  assert.equal(result.manualTaskId, "task-conflict-1");
  assert.deepEqual(createdTasks, [TERMINAL_STATES.CONFLICT_BLOCKED]);
});

test("S-PC-02-003: report summarizes statuses with correlation_id", () => {
  const report = buildReplayStatusReport([
    {
      terminalState: TERMINAL_STATES.REPLAYED,
      eventId: "evt-1",
      correlationId: "corr-1",
    },
    {
      terminalState: TERMINAL_STATES.EXPIRED_MANUAL,
      eventId: "evt-2",
      correlationId: "corr-2",
    },
    {
      terminalState: TERMINAL_STATES.CONFLICT_BLOCKED,
      eventId: "evt-3",
      correlationId: "corr-3",
    },
    {
      terminalState: TERMINAL_STATES.CONFLICT_BLOCKED,
      eventId: "evt-4",
      correlationId: "corr-4",
    },
  ]);

  assert.equal(report.totals.replayed, 1);
  assert.equal(report.totals.expired_manual, 1);
  assert.equal(report.totals.conflict_blocked, 2);
  assert.equal(report.by_status.replayed[0].correlation_id, "corr-1");
  assert.equal(report.by_status.conflict_blocked[1].correlation_id, "corr-4");
});
