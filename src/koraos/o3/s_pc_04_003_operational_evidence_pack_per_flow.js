export const TERMINAL_STATES = Object.freeze({
  EVIDENCE_PACK_GENERATED: "evidence_pack_generated",
  EVIDENCE_PACK_PARTIAL: "evidence_pack_partial",
  EVIDENCE_PACK_FAILED_ALERTED: "evidence_pack_failed_alerted",
});

export const FLOW_IDS = Object.freeze(["F-01", "F-02", "F-03", "F-04", "F-05", "F-06"]);

const REQUIRED_PACK_FIELDS = Object.freeze([
  "flow_id",
  "correlation_id",
  "logs",
  "metrics",
  "alerts",
  "terminal_state",
  "timeline",
]);

export async function generateOperationalEvidencePack({
  flowId,
  correlationId,
  logs = [],
  metrics = [],
  alerts = [],
  terminalState,
  timeline = [],
  persistEvidencePack = async () => ({ persisted: true, packId: "pack-1" }),
  emitAlert = async () => ({ alertId: "alert-evidence-pack-1" }),
}) {
  try {
    const pack = buildEvidencePack({
      flowId,
      correlationId,
      logs,
      metrics,
      alerts,
      terminalState,
      timeline,
    });
    const completeness = evaluateEvidencePackCompleteness(pack);

    if (completeness.completenessPercent === 100) {
      const persisted = await persistEvidencePack(pack);
      return {
        terminalState: TERMINAL_STATES.EVIDENCE_PACK_GENERATED,
        reason: "evidence_pack_complete",
        pack,
        completenessPercent: completeness.completenessPercent,
        missingFields: [],
        packId: persisted && persisted.packId ? persisted.packId : null,
        alertId: null,
      };
    }

    if (completeness.completenessPercent >= 70) {
      const alert = await emitAlert({
        reason: "evidence_pack_partial",
        flowId: pack.flow_id,
        correlationId: pack.correlation_id,
        completenessPercent: completeness.completenessPercent,
        missingFields: completeness.missingFields,
      });
      const persisted = await persistEvidencePack(pack);
      return {
        terminalState: TERMINAL_STATES.EVIDENCE_PACK_PARTIAL,
        reason: "evidence_pack_partial",
        pack,
        completenessPercent: completeness.completenessPercent,
        missingFields: completeness.missingFields,
        packId: persisted && persisted.packId ? persisted.packId : null,
        alertId: alert && alert.alertId ? alert.alertId : null,
      };
    }

    const alert = await emitAlert({
      reason: "evidence_pack_incomplete_critical",
      flowId: pack.flow_id,
      correlationId: pack.correlation_id,
      completenessPercent: completeness.completenessPercent,
    });
    return {
      terminalState: TERMINAL_STATES.EVIDENCE_PACK_FAILED_ALERTED,
      reason: "evidence_pack_completeness_below_threshold",
      pack,
      completenessPercent: completeness.completenessPercent,
      missingFields: completeness.missingFields,
      packId: null,
      alertId: alert && alert.alertId ? alert.alertId : null,
    };
  } catch (_error) {
    const alert = await emitAlert({
      reason: "evidence_pack_generation_failure",
      flowId,
      correlationId,
    });
    return {
      terminalState: TERMINAL_STATES.EVIDENCE_PACK_FAILED_ALERTED,
      reason: "evidence_pack_generation_failure",
      pack: null,
      completenessPercent: 0,
      missingFields: [...REQUIRED_PACK_FIELDS],
      packId: null,
      alertId: alert && alert.alertId ? alert.alertId : null,
    };
  }
}

export function buildEvidencePack({
  flowId,
  correlationId,
  logs,
  metrics,
  alerts,
  terminalState,
  timeline,
}) {
  return {
    flow_id: normalizeFlowId(flowId),
    correlation_id: correlationId || null,
    logs: Array.isArray(logs) ? logs : [],
    metrics: Array.isArray(metrics) ? metrics : [],
    alerts: Array.isArray(alerts) ? alerts : [],
    terminal_state: terminalState || null,
    timeline: Array.isArray(timeline) ? timeline : [],
    generated_at_utc: new Date().toISOString(),
  };
}

export function evaluateEvidencePackCompleteness(pack) {
  const missingFields = [];
  for (const field of REQUIRED_PACK_FIELDS) {
    const value = pack && pack[field];
    const emptyArray = Array.isArray(value) && value.length === 0;
    if (value == null || emptyArray) {
      missingFields.push(field);
    }
  }

  const completenessPercent = Number(
    (((REQUIRED_PACK_FIELDS.length - missingFields.length) / REQUIRED_PACK_FIELDS.length) * 100).toFixed(2)
  );
  return {
    completenessPercent,
    missingFields,
  };
}

export function buildEvidenceTimelineReconstruction(pack) {
  if (!pack || !Array.isArray(pack.timeline)) {
    return [];
  }

  return [...pack.timeline]
    .map((entry) => ({
      ts: Date.parse(entry.ts),
      event: entry.event || "unknown_event",
      status: entry.status || "unknown_status",
      correlation_id: entry.correlation_id || pack.correlation_id || null,
    }))
    .filter((entry) => Number.isFinite(entry.ts))
    .sort((left, right) => left.ts - right.ts)
    .map((entry) => ({
      ts: new Date(entry.ts).toISOString(),
      event: entry.event,
      status: entry.status,
      correlation_id: entry.correlation_id,
    }));
}

function normalizeFlowId(flowId) {
  const normalized = String(flowId || "")
    .trim()
    .toUpperCase();
  return FLOW_IDS.includes(normalized) ? normalized : "F-01";
}
