import test from "node:test";
import assert from "node:assert/strict";

import {
  ALERT_MATRIX,
  TERMINAL_STATES,
  buildOperationalAlertHistoryReport,
  processOperationalAlert,
} from "../../src/koraos/o2/s_pc_04_002_operational_alerts_matrix.js";

test("S-PC-04-002: alerts fire correctly for each configured trigger", async () => {
  const triggerTypes = [
    "no_ack_critical_alert",
    "ack_to_enqueue_gap",
    "takeover_sla_breach_rate",
    "replay_backlog",
  ];

  for (const alertType of triggerTypes) {
    const result = await processOperationalAlert({
      alertType,
      correlationId: `corr-${alertType}`,
      triggerPayload: { metric: 1 },
      ackAtMinute: 1,
    });

    assert.equal(result.terminalState, TERMINAL_STATES.ALERT_FIRED_ACKNOWLEDGED);
    assert.equal(result.alertLog.alert_type, alertType);
    assert.equal(result.alertLog.owner, ALERT_MATRIX[alertType].owner);
  }
});

test("S-PC-04-002: no ACK in SLA escalates the alert", async () => {
  const result = await processOperationalAlert({
    alertType: "no_ack_critical_alert",
    correlationId: "corr-escalate-1",
    triggerPayload: { metric: "no_ack" },
    ackAtMinute: null,
    escalateIncident: async () => ({ incidentId: "incident-escalate-1" }),
  });

  assert.equal(result.terminalState, TERMINAL_STATES.ALERT_FIRED_NO_ACK_ESCALATED);
  assert.equal(result.incidentId, "incident-escalate-1");
});

test("S-PC-04-002: ACK closes alert cycle without duplication", async () => {
  let alertSends = 0;
  const result = await processOperationalAlert({
    alertType: "replay_backlog",
    correlationId: "corr-ack-1",
    triggerPayload: { backlog: 50 },
    ackAtMinute: 3,
    sendAlert: async () => {
      alertSends += 1;
      return { delivered: true };
    },
  });

  assert.equal(result.terminalState, TERMINAL_STATES.ALERT_FIRED_ACKNOWLEDGED);
  assert.equal(alertSends, 1);
});

test("S-PC-04-002: history report consolidates ownership and firing status", () => {
  const report = buildOperationalAlertHistoryReport([
    {
      terminalState: TERMINAL_STATES.ALERT_FIRED_ACKNOWLEDGED,
      alertLog: { alert_type: "replay_backlog", owner: "sre_superadmin" },
    },
    {
      terminalState: TERMINAL_STATES.ALERT_FIRED_NO_ACK_ESCALATED,
      alertLog: { alert_type: "replay_backlog", owner: "sre_superadmin" },
    },
    {
      terminalState: TERMINAL_STATES.ALERT_FIRED_ACKNOWLEDGED,
      alertLog: { alert_type: "no_ack_critical_alert", owner: "superadmin" },
    },
  ]);

  assert.equal(report.totals.alert_fired_acknowledged, 2);
  assert.equal(report.totals.alert_fired_no_ack_escalated, 1);
  assert.deepEqual(report.byType.replay_backlog.owners, ["sre_superadmin"]);
  assert.equal(report.byType.replay_backlog.escalated, 1);
});
