import {
  validateQueueEvent,
} from "../koraos/o1/s_pc_01_001_dispatch_priority_vs_commit_order.js";
import {
  evaluateSafeModeExit,
} from "../koraos/o2/s_pc_03_004_safe_mode_exit_controlled_recovery.js";
import {
  generateOperationalEvidencePack,
} from "../koraos/o3/s_pc_04_003_operational_evidence_pack_per_flow.js";
import {
  runRedisFailureDrill,
} from "../koraos/o3/s_pc_05_002_redis_failure_drill_controlled_continuity.js";

export function createScenarioRegistry() {
  return {
    "o1.dispatch.validate": {
      description: "Validate dispatch vs commit-order contract (S-PC-01-001).",
      execute: async (input = {}) => {
        const result = validateQueueEvent(
          input.event || {},
          new Map(input.lastCommitOrderByContactEntries || [])
        );
        return result;
      },
    },
    "o2.safe_mode.exit": {
      description: "Evaluate safe mode controlled exit contract (S-PC-03-004).",
      execute: async (input = {}) => {
        const runtime = input.runtime || {
          safeModeActive: true,
          blockedSideEffects: ["schedule", "reschedule", "cancel"],
          unlockedSideEffects: [],
        };
        return evaluateSafeModeExit({
          safeModeActive:
            input.safeModeActive == null ? true : Boolean(input.safeModeActive),
          ackId: input.ackId || "ack-runtime-default",
          recoveryAction: input.recoveryAction || "recovery-runtime-default",
          checklist: input.checklist || {
            ackValidated: true,
            recoveryActionLogged: true,
            opsNotified: true,
          },
          healthChecks:
            input.healthChecks ||
            buildDefaultHealthyWindow("2026-02-10T10:00:00Z", 10),
          runtime,
        });
      },
    },
    "o3.evidence_pack.generate": {
      description: "Generate operational evidence pack per flow (S-PC-04-003).",
      execute: async (input = {}) => {
        return generateOperationalEvidencePack({
          flowId: input.flowId || "F-01",
          correlationId: input.correlationId || "corr-runtime-default",
          logs: input.logs || [{ ts: new Date().toISOString(), event: "log" }],
          metrics: input.metrics || [{ key: "latency_p95", value: 120 }],
          alerts: input.alerts || [{ code: "none" }],
          terminalState: input.terminalState || "ok",
          timeline:
            input.timeline ||
            [
              {
                ts: new Date().toISOString(),
                event: "start",
                status: "ok",
                correlation_id: input.correlationId || "corr-runtime-default",
              },
            ],
        });
      },
    },
    "o3.redis_drill.run": {
      description: "Run controlled Redis failure drill (S-PC-05-002).",
      execute: async (input = {}) => {
        return runRedisFailureDrill({
          correlationId: input.correlationId || "corr-drill-runtime",
        });
      },
    },
  };
}

function buildDefaultHealthyWindow(startIso, minutes) {
  const entries = [];
  const start = Date.parse(startIso);
  for (let minute = 0; minute <= minutes; minute += 1) {
    entries.push({
      ts: new Date(start + minute * 60_000).toISOString(),
      healthy: true,
    });
  }
  return entries;
}
