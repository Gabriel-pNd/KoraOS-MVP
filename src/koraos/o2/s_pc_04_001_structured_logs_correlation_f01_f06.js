export const TERMINAL_STATES = Object.freeze({
  LOG_EMITTED_STRUCTURED: "log_emitted_structured",
  LOG_EMIT_FAILED_ALERTED: "log_emit_failed_alerted",
});

export const REQUIRED_FIELDS = Object.freeze([
  "correlation_id",
  "contact_id",
  "flow_id",
  "intent",
  "status",
  "ts",
]);

export const FLOW_IDS = Object.freeze(["F-01", "F-02", "F-03", "F-04", "F-05", "F-06"]);

export async function emitStructuredFlowLog({
  flowId,
  payload,
  emitToSink = async () => ({ persisted: true }),
  emitAlert = async () => ({ alertId: "alert-log-sink-1" }),
}) {
  const logEntry = buildStructuredLogEntry({ flowId, payload });
  const schemaValidation = validateLogSchema(logEntry);
  if (!schemaValidation.valid) {
    return {
      terminalState: TERMINAL_STATES.LOG_EMIT_FAILED_ALERTED,
      reason: "invalid_log_schema",
      logEntry,
      missingFields: schemaValidation.missingFields,
      alertId: null,
    };
  }

  try {
    await emitToSink(logEntry);
    return {
      terminalState: TERMINAL_STATES.LOG_EMITTED_STRUCTURED,
      reason: "log_emitted",
      logEntry,
      missingFields: [],
      alertId: null,
    };
  } catch (_error) {
    const alert = await emitAlert({
      reason: "log_sink_failure",
      flowId,
      correlationId: logEntry.correlation_id,
    });
    return {
      terminalState: TERMINAL_STATES.LOG_EMIT_FAILED_ALERTED,
      reason: "log_sink_failure",
      logEntry,
      missingFields: [],
      alertId: alert && alert.alertId ? alert.alertId : null,
    };
  }
}

export function buildStructuredLogEntry({ flowId, payload }) {
  const correlationId = payload && payload.correlation_id ? payload.correlation_id : null;
  const entry = {
    correlation_id: correlationId || buildFallbackCorrelationId(flowId),
    contact_id: payload && payload.contact_id ? payload.contact_id : null,
    flow_id: normalizeFlowId(flowId),
    intent: payload && payload.intent ? payload.intent : "unknown_intent",
    status: payload && payload.status ? payload.status : "unknown_status",
    ts: payload && payload.ts ? payload.ts : new Date().toISOString(),
  };

  if (payload && typeof payload === "object") {
    for (const [key, value] of Object.entries(payload)) {
      if (entry[key] == null) {
        entry[key] = value;
      }
    }
  }

  return entry;
}

export function validateLogSchema(logEntry) {
  const missingFields = REQUIRED_FIELDS.filter((field) => {
    const value = logEntry && logEntry[field];
    return value == null || value === "";
  });
  return {
    valid: missingFields.length === 0,
    missingFields,
  };
}

export function propagateCorrelationId({ upstreamCorrelationId, fallbackContext }) {
  if (upstreamCorrelationId && String(upstreamCorrelationId).trim() !== "") {
    return String(upstreamCorrelationId);
  }

  return buildFallbackCorrelationId(fallbackContext && fallbackContext.flowId);
}

export function buildFlowCoverageReport(entries = []) {
  const report = {
    totalEntries: entries.length,
    correlationCoveragePercent: 0,
    flowCoverage: {},
  };

  let withCorrelation = 0;
  for (const flowId of FLOW_IDS) {
    report.flowCoverage[flowId] = {
      total: 0,
      withCorrelation: 0,
    };
  }

  for (const entry of entries) {
    if (!entry) {
      continue;
    }

    const flowId = normalizeFlowId(entry.flow_id);
    if (!report.flowCoverage[flowId]) {
      report.flowCoverage[flowId] = { total: 0, withCorrelation: 0 };
    }

    report.flowCoverage[flowId].total += 1;
    if (entry.correlation_id) {
      report.flowCoverage[flowId].withCorrelation += 1;
      withCorrelation += 1;
    }
  }

  report.correlationCoveragePercent =
    entries.length > 0 ? Number(((withCorrelation / entries.length) * 100).toFixed(2)) : 0;
  return report;
}

function normalizeFlowId(flowId) {
  const normalized = String(flowId || "")
    .trim()
    .toUpperCase();
  return FLOW_IDS.includes(normalized) ? normalized : "F-01";
}

function buildFallbackCorrelationId(flowId) {
  const normalizedFlow = normalizeFlowId(flowId);
  return `corr:${normalizedFlow}:${Date.now()}`;
}
