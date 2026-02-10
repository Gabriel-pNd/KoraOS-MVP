import test from "node:test";
import assert from "node:assert/strict";

import {
  TERMINAL_STATES,
  FLOW_IDS,
  buildFlowCoverageReport,
  buildStructuredLogEntry,
  emitStructuredFlowLog,
  propagateCorrelationId,
  validateLogSchema,
} from "../../src/koraos/o2/s_pc_04_001_structured_logs_correlation_f01_f06.js";

test("S-PC-04-001: logs are emitted for F-01..F-06 with valid schema", async () => {
  const persistedLogs = [];
  for (const flowId of FLOW_IDS) {
    const result = await emitStructuredFlowLog({
      flowId,
      payload: {
        correlation_id: `corr-${flowId}`,
        contact_id: "contact-1",
        intent: "schedule",
        status: "ok",
        ts: "2026-02-10T10:00:00Z",
      },
      emitToSink: async (entry) => {
        persistedLogs.push(entry);
      },
    });

    assert.equal(result.terminalState, TERMINAL_STATES.LOG_EMITTED_STRUCTURED);
    assert.equal(result.logEntry.flow_id, flowId);
  }

  assert.equal(persistedLogs.length, FLOW_IDS.length);
});

test("S-PC-04-001: correlation_id is propagated across services", () => {
  const inherited = propagateCorrelationId({
    upstreamCorrelationId: "corr-inherited-1",
    fallbackContext: { flowId: "F-03" },
  });
  const generated = propagateCorrelationId({
    upstreamCorrelationId: "",
    fallbackContext: { flowId: "F-05" },
  });

  assert.equal(inherited, "corr-inherited-1");
  assert.ok(generated.startsWith("corr:F-05:"));
});

test("S-PC-04-001: sink failure alerts without breaking main flow", async () => {
  const result = await emitStructuredFlowLog({
    flowId: "F-06",
    payload: {
      correlation_id: "corr-sink-fail-1",
      contact_id: "contact-2",
      intent: "safe_mode",
      status: "warn",
      ts: "2026-02-10T10:05:00Z",
    },
    emitToSink: async () => {
      throw new Error("sink failure");
    },
    emitAlert: async () => ({ alertId: "alert-sink-1" }),
  });

  assert.equal(result.terminalState, TERMINAL_STATES.LOG_EMIT_FAILED_ALERTED);
  assert.equal(result.alertId, "alert-sink-1");
});

test("S-PC-04-001: coverage report validates required fields and correlation percentage", () => {
  const completeEntry = buildStructuredLogEntry({
    flowId: "F-01",
    payload: {
      correlation_id: "corr-cover-1",
      contact_id: "contact-cover-1",
      intent: "schedule",
      status: "ok",
      ts: "2026-02-10T10:00:00Z",
    },
  });
  const missingCorrelationEntry = buildStructuredLogEntry({
    flowId: "F-02",
    payload: {
      contact_id: "contact-cover-2",
      intent: "replay",
      status: "ok",
      ts: "2026-02-10T10:01:00Z",
    },
  });
  missingCorrelationEntry.correlation_id = null;

  const completeValidation = validateLogSchema(completeEntry);
  assert.equal(completeValidation.valid, true);

  const report = buildFlowCoverageReport([completeEntry, missingCorrelationEntry]);
  assert.equal(report.totalEntries, 2);
  assert.equal(report.correlationCoveragePercent, 50);
  assert.equal(report.flowCoverage["F-01"].withCorrelation, 1);
});
