export const TERMINAL_STATES = Object.freeze({
  TTL_VALID_READY_FOR_REPLAY: "ttl_valid_ready_for_replay",
  EXPIRED_MANUAL: "expired_manual",
  INVALID_EVENT_MANUAL: "invalid_event_manual",
});

export const DEFAULT_TTL_POLICIES = Object.freeze({
  schedule: Object.freeze({ type: "duration_minutes", value: 120 }),
  reschedule: Object.freeze({ type: "duration_minutes", value: 120 }),
  cancel: Object.freeze({ type: "duration_minutes", value: 120 }),
  d1_confirmation: Object.freeze({ type: "until_appointment_minus_minutes", value: 30 }),
  follow_up_non_transactional: Object.freeze({ type: "duration_hours", value: 24 }),
});

const NORMALIZED_INTENT_ALIASES = Object.freeze({
  d1_confirmation_action: "d1_confirmation",
  d1_confirmation: "d1_confirmation",
  d1: "d1_confirmation",
  schedule: "schedule",
  reschedule: "reschedule",
  cancel: "cancel",
  follow_up: "follow_up_non_transactional",
  follow_up_non_transactional: "follow_up_non_transactional",
});

export function validateReplayTtl({
  replayEvent,
  nowUtc = new Date().toISOString(),
  ttlPolicies = DEFAULT_TTL_POLICIES,
}) {
  if (!replayEvent || typeof replayEvent !== "object") {
    return buildResult({
      replayEvent,
      terminalState: TERMINAL_STATES.INVALID_EVENT_MANUAL,
      reason: "invalid_replay_event",
      ttlPolicyLabel: null,
      ttlLimitUtc: null,
      eventAgeMinutes: null,
    });
  }

  const normalizedIntent = normalizeIntentType(replayEvent.intentType);
  const ttlPolicy = resolveTtlPolicy(normalizedIntent, ttlPolicies);
  if (!ttlPolicy) {
    return buildResult({
      replayEvent,
      terminalState: TERMINAL_STATES.INVALID_EVENT_MANUAL,
      reason: "unsupported_intent_type",
      ttlPolicyLabel: null,
      ttlLimitUtc: null,
      eventAgeMinutes: null,
    });
  }

  const eventOccurredAt = parseDate(replayEvent.occurredAtUtc || replayEvent.originalOccurredAtUtc);
  const nowDate = parseDate(nowUtc);
  if (!eventOccurredAt || !nowDate) {
    return buildResult({
      replayEvent,
      terminalState: TERMINAL_STATES.INVALID_EVENT_MANUAL,
      reason: "invalid_timestamp",
      ttlPolicyLabel: ttlPolicyLabel(ttlPolicy),
      ttlLimitUtc: null,
      eventAgeMinutes: null,
    });
  }

  const ttlLimitDate = computeTtlLimitDate({
    replayEvent,
    eventOccurredAt,
    ttlPolicy,
  });

  if (!ttlLimitDate) {
    return buildResult({
      replayEvent,
      terminalState: TERMINAL_STATES.INVALID_EVENT_MANUAL,
      reason: "invalid_ttl_context",
      ttlPolicyLabel: ttlPolicyLabel(ttlPolicy),
      ttlLimitUtc: null,
      eventAgeMinutes: elapsedMinutes(eventOccurredAt, nowDate),
    });
  }

  const eventAgeMinutes = elapsedMinutes(eventOccurredAt, nowDate);
  if (nowDate > ttlLimitDate) {
    return buildResult({
      replayEvent,
      terminalState: TERMINAL_STATES.EXPIRED_MANUAL,
      reason: "ttl_expired",
      ttlPolicyLabel: ttlPolicyLabel(ttlPolicy),
      ttlLimitUtc: ttlLimitDate.toISOString(),
      eventAgeMinutes,
    });
  }

  return buildResult({
    replayEvent,
    terminalState: TERMINAL_STATES.TTL_VALID_READY_FOR_REPLAY,
    reason: "ttl_valid",
    ttlPolicyLabel: ttlPolicyLabel(ttlPolicy),
    ttlLimitUtc: ttlLimitDate.toISOString(),
    eventAgeMinutes,
  });
}

export function buildReplayTtlAuditLog({
  correlationId,
  intentType,
  eventAgeMinutes,
  ttlPolicy,
  ttlLimitUtc,
  terminalState,
  reason,
}) {
  return {
    correlation_id: correlationId || null,
    intent: intentType || null,
    event_age_minutes: eventAgeMinutes == null ? null : eventAgeMinutes,
    ttl_policy: ttlPolicy || null,
    ttl_limit_utc: ttlLimitUtc || null,
    result: terminalState,
    reason: reason || null,
  };
}

function buildResult({
  replayEvent,
  terminalState,
  reason,
  ttlPolicyLabel,
  ttlLimitUtc,
  eventAgeMinutes,
}) {
  return {
    terminalState,
    reason,
    ttlPolicy: ttlPolicyLabel,
    ttlLimitUtc,
    eventAgeMinutes,
    auditLog: buildReplayTtlAuditLog({
      correlationId: replayEvent && replayEvent.correlationId,
      intentType: replayEvent && normalizeIntentType(replayEvent.intentType),
      eventAgeMinutes,
      ttlPolicy: ttlPolicyLabel,
      ttlLimitUtc,
      terminalState,
      reason,
    }),
  };
}

function resolveTtlPolicy(normalizedIntentType, ttlPolicies) {
  if (!normalizedIntentType || !ttlPolicies) {
    return null;
  }

  return ttlPolicies[normalizedIntentType] || null;
}

function normalizeIntentType(intentType) {
  const key = String(intentType || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_");
  return NORMALIZED_INTENT_ALIASES[key] || null;
}

function ttlPolicyLabel(ttlPolicy) {
  if (!ttlPolicy) {
    return null;
  }

  if (ttlPolicy.type === "duration_minutes") {
    return `${ttlPolicy.value}m`;
  }

  if (ttlPolicy.type === "duration_hours") {
    return `${ttlPolicy.value}h`;
  }

  if (ttlPolicy.type === "until_appointment_minus_minutes") {
    return `appointment_start_minus_${ttlPolicy.value}m`;
  }

  return "unknown_policy";
}

function computeTtlLimitDate({ replayEvent, eventOccurredAt, ttlPolicy }) {
  if (ttlPolicy.type === "duration_minutes") {
    return new Date(eventOccurredAt.getTime() + ttlPolicy.value * 60_000);
  }

  if (ttlPolicy.type === "duration_hours") {
    return new Date(eventOccurredAt.getTime() + ttlPolicy.value * 3_600_000);
  }

  if (ttlPolicy.type === "until_appointment_minus_minutes") {
    const appointmentStartDate = parseDate(replayEvent.appointmentStartUtc);
    if (!appointmentStartDate) {
      return null;
    }
    return new Date(appointmentStartDate.getTime() - ttlPolicy.value * 60_000);
  }

  return null;
}

function parseDate(value) {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) {
    return null;
  }
  return new Date(timestamp);
}

function elapsedMinutes(startDate, endDate) {
  const difference = Math.max(0, endDate.getTime() - startDate.getTime());
  return Math.floor(difference / 60_000);
}
