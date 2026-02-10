import test from "node:test";
import assert from "node:assert/strict";

import {
  FLOW_IDS,
  TERMINAL_STATES,
  buildEvidenceTimelineReconstruction,
  generateOperationalEvidencePack,
} from "../../src/koraos/o3/s_pc_04_003_operational_evidence_pack_per_flow.js";

function buildCompleteInput(flowId) {
  return {
    flowId,
    correlationId: `corr-${flowId}`,
    logs: [{ ts: "2026-02-10T10:00:00Z", event: "log-event" }],
    metrics: [{ key: "latency_p95", value: 120 }],
    alerts: [{ code: "none" }],
    terminalState: "ok",
    timeline: [
      { ts: "2026-02-10T10:00:00Z", event: "start", status: "ok", correlation_id: `corr-${flowId}` },
      { ts: "2026-02-10T10:01:00Z", event: "end", status: "ok", correlation_id: `corr-${flowId}` },
    ],
  };
}

test("S-PC-04-003: complete evidence pack is generated for each flow F-01..F-06", async () => {
  for (const flowId of FLOW_IDS) {
    const result = await generateOperationalEvidencePack({
      ...buildCompleteInput(flowId),
      persistEvidencePack: async () => ({ persisted: true, packId: `pack-${flowId}` }),
    });

    assert.equal(result.terminalState, TERMINAL_STATES.EVIDENCE_PACK_GENERATED);
    assert.equal(result.pack.flow_id, flowId);
    assert.equal(result.completenessPercent, 100);
  }
});

test("S-PC-04-003: pack correlates logs metrics and alerts by correlation_id", async () => {
  const result = await generateOperationalEvidencePack({
    ...buildCompleteInput("F-03"),
    correlationId: "corr-shared-1",
  });

  assert.equal(result.pack.correlation_id, "corr-shared-1");
  assert.equal(result.pack.logs[0].event, "log-event");
  assert.equal(result.pack.metrics[0].key, "latency_p95");
  assert.equal(result.pack.alerts[0].code, "none");
});

test("S-PC-04-003: partial failure returns evidence_pack_partial with missing fields", async () => {
  const result = await generateOperationalEvidencePack({
    flowId: "F-04",
    correlationId: "corr-partial-1",
    logs: [{ ts: "2026-02-10T10:00:00Z", event: "event" }],
    metrics: [{ key: "k", value: 1 }],
    alerts: [],
    terminalState: "ok",
    timeline: [{ ts: "2026-02-10T10:00:00Z", event: "start", status: "ok" }],
    emitAlert: async () => ({ alertId: "alert-partial-1" }),
  });

  assert.equal(result.terminalState, TERMINAL_STATES.EVIDENCE_PACK_PARTIAL);
  assert.ok(result.missingFields.includes("alerts"));
  assert.equal(result.alertId, "alert-partial-1");
});

test("S-PC-04-003: QA can reconstruct timeline from evidence pack", () => {
  const timeline = buildEvidenceTimelineReconstruction({
    correlation_id: "corr-timeline-1",
    timeline: [
      { ts: "2026-02-10T10:02:00Z", event: "end", status: "ok" },
      { ts: "2026-02-10T10:00:00Z", event: "start", status: "ok" },
      { ts: "2026-02-10T10:01:00Z", event: "process", status: "ok" },
    ],
  });

  assert.equal(timeline.length, 3);
  assert.deepEqual(timeline.map((entry) => entry.event), ["start", "process", "end"]);
  assert.ok(timeline.every((entry) => entry.correlation_id === "corr-timeline-1"));
});
