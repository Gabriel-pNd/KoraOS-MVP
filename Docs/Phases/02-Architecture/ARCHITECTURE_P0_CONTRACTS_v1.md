# Architecture P0 Contracts v1

## 1. Metadata
- Project: KoraOS MVP
- Phase: 02-Architecture
- Date: 2026-02-09
- Owner: Architecture
- Inputs:
  - `Docs/Handoffs/HANDOFF_2026-02-09_PHASE-01-UX_v1.md`
  - `Docs/Phases/01-UX/UX_FLOW_MAP_P0_v1.md`
  - `Docs/Phases/01-UX/UX_WIREFRAME_SPEC_P0_v1.md`
  - `Docs/PRD/12_prd_koraos_mvp_v1.0.md`
  - `Docs/PRD/13_prd_review_blindspots_v1.3.md`

## 2. Purpose
Translate approved UX P0 flows into technical contracts and architecture decisions, with explicit treatment for:
1. causal ordering vs queue priority
2. replay fences (TTL + version checks)
3. safe mode model and recovery criteria
4. minimum observability and incident controls

## 3. Frozen Constraints Applied
1. Throughput per clinic: 1,000 msg/day, peak 18 msg/min.
2. Queue priority (dispatch): urgency/takeover > confirmation/reschedule > new leads > follow-up.
3. Human SLA:
   - business hours <= 15 min
   - after-hours urgent not applicable
   - non-urgent <= 30 min after next shift starts
4. D-1 policy:
   - AI sends 09:00-12:00
   - pending at 16:00 -> manual task
   - pending at 17:00 -> secretary+manager alert
   - still pending next day -> notify 30 min before opening
5. Guardians: deny-by-default + explicit primary guardian permission.
6. WhatsApp contingency: runbook + contingency queue + replay.
7. Critical alert policy:
   - owner: superadmin
   - WhatsApp resend every 5 min for 30 min
   - mandatory ACK
   - no ACK in 15 min -> safe mode
8. N8N limitation: no direct base-table access, only API or isolated views.

## 4. Target Architecture (P0)
## 4.1 Logical Components
1. Channel Ingress (NestJS webhook adapters)
2. Durable Inbox + Dedup Layer (Supabase/Postgres)
3. Dispatcher (priority-aware scheduling)
4. Contact Stream Processor (causal order per `contact_id`)
5. Command Gateway (side-effect guardrails + idempotency)
6. Conversation/Context Service
7. Scheduling Service
8. Takeover/Ticket Service
9. D-1 Scheduler Orchestration
10. Contingency/Replay Service
11. Safe Mode Controller
12. Observability/Audit Pipeline

## 4.2 Hard Separation Rules
1. N8N can orchestrate but cannot mutate base entities directly.
2. All sensitive side-effects go through Command Gateway.
3. RLS and tenant context are mandatory for every tenant-scoped operation.

## 5. Core Decisions (ADR-lite)
| ID | Decision | Why | Owner |
|---|---|---|---|
| D-AR-001 | Commit order is causal-by-contact; priority affects dispatch only | Prevent stale side-effects under takeover urgency | Architecture |
| D-AR-002 | Replay requires TTL + version revalidation before commit | Prevent late events from mutating current state | Architecture + Backend |
| D-AR-003 | Safe mode blocks scheduling side-effects but keeps ingestion | Enforce fail-safe without message loss | Architecture + DevOps |
| D-AR-004 | Exit from safe mode requires ACK + auditable recovery action | Avoid unsafe silent recovery | Architecture + Ops |
| D-AR-005 | Observability is flow-centric (F-01..F-06) with mandatory correlation IDs | Support incident triage and non-repudiation | Architecture + QA |
| D-AR-006 | Redis is explicit for lock/idempotency; DB fallback kept for degraded mode | Align with approved risk mitigation | Architecture |
| D-AR-007 | N8N HA/scaling remains deferred in this round (accepted risk) | Respect prior PO decision and scope control | PO + Architecture |

## 6. Contract Foundations
## 6.1 Event Envelope (required)
```
event_id
tenant_id
contact_id
conversation_id
external_id
source               # whatsapp|system|replay
event_type
occurred_at_utc
received_at_utc
sequence             # provider or synthetic per contact
correlation_id
causation_id
payload_version
```

## 6.2 Command Envelope (required for side-effects)
```
command_id
tenant_id
contact_id
conversation_id
command_type         # schedule|reschedule|cancel|takeover|...
idempotency_key
requested_by         # ai|human|system
confirmed_by_contact # bool
guardian_version     # authorization version token
conversation_version_at_decision
requested_at_utc
```

## 6.3 Invariants
1. One contact stream = one causal commit order.
2. Duplicate external events cannot create duplicate side-effects.
3. Sensitive action requires explicit confirmation + valid guardian permission.
4. `takeover_active` forbids AI side-effects until takeover closes.
5. Safe mode forbids schedule/reschedule/cancel until recovery gates pass.

## 7. Flow Contracts (F-01..F-06)
## 7.1 F-01 Ingress and Triage
- Trigger: inbound WhatsApp event.
- Inputs: Event Envelope.
- Processing contract:
  1. ACK technical response p95 <= 2s.
  2. Persist to durable inbox before processing.
  3. Dedup by (`tenant_id`, `external_id`) for active records.
- Outputs:
  - queued event id
  - triage classification request
- Failure path:
  - if persistence fails, do not mark as accepted in internal metrics and raise incident.

## 7.2 F-02 Qualification to Scheduling
- Trigger: scheduling intent.
- Inputs: Event + current context + guardian policy.
- Processing contract:
  1. Validate guardian authorization (deny-by-default).
  2. Require explicit confirmation token.
  3. Submit command through Command Envelope.
  4. Enforce idempotency key and optimistic version check.
- Outputs:
  - schedule command committed or blocked reason.
- Failure path:
  - ambiguous confirmation or missing permission -> blocked + user-safe response.

## 7.3 F-03 D-1 Confirmation
- Trigger: D-1 scheduler window.
- Inputs: appointment list by tenant timezone.
- Processing contract:
  1. AI sends periodic confirmations 09:00-12:00.
  2. Unresolved at 16:00 -> manual task create.
  3. Unresolved at 17:00 -> secretary+manager notification.
  4. Next day unresolved -> notify 30 min pre-opening.
- Outputs:
  - confirmation status timeline
  - task/alert records
- Failure path:
  - scheduler miss or conflict -> reconciliation job + audit event.

## 7.4 F-04 Human Takeover
- Trigger: explicit user request, frustration rule, or manual takeover.
- Inputs: conversation context + SLA policy.
- Processing contract:
  1. Create ticket with context snapshot.
  2. Set conversation state `takeover_active`.
  3. Block AI response/send while active.
  4. Track deadlines and escalation levels.
  5. Close takeover with reason and restore AI only after closure.
- Outputs:
  - takeover ticket lifecycle
  - conversation state transitions
- Failure path:
  - deadline breach -> auto escalation + manager alert.

## 7.5 F-05 Contingency and Replay
- Trigger: channel outage/degradation.
- Inputs: backlog events + current state versions.
- Processing contract:
  1. Route new events to contingency queue.
  2. Replay in controlled batches after recovery.
  3. Revalidate versions before every side-effect commit.
  4. Expired replay event must convert to manual task.
- Outputs:
  - replay status per event (`replayed`, `expired_manual`, `conflict_blocked`)
- Failure path:
  - backlog growth over threshold -> throttled replay and incident escalation.

## 7.6 F-06 Safe Mode on Missing ACK
- Trigger: critical technical alert with no ACK in 15 min.
- Inputs: incident signal + ACK state.
- Processing contract:
  1. Resend alert every 5 min for up to 30 min.
  2. Enter `safe_mode_restricted` at 15 min without ACK.
  3. Block `schedule|reschedule|cancel` commands.
  4. Keep ingestion and queue pending operations.
  5. Emit contingency user message.
  6. Open critical ticket for next shift action.
- Exit contract:
  1. Require ACK record.
  2. Require auditable recovery action.
  3. Require health checks green before unblocking side-effects.

## 8. State Models
## 8.1 Conversation State
`active_ai -> awaiting_explicit_confirmation -> committed|blocked`
`active_ai -> takeover_active -> active_ai`
`* -> safe_mode_restricted` (global gating layer for commands)

## 8.2 Takeover Ticket State
`open -> in_progress -> resolved`
`open|in_progress -> sla_warning -> sla_breached -> escalated`

## 8.3 Replay State
`queued -> replaying -> replayed`
`replaying -> expired_manual`
`replaying -> conflict_blocked`

## 9. Replay Fences (baseline)
1. TTL by intent (tenant-configurable, defaults):
   - schedule/reschedule/cancel: 120 min
   - D-1 confirmation action: until appointment_start - 30 min
   - follow-up non-transactional: 24 h
2. Version checks required:
   - `conversation_version_at_decision == current_conversation_version`
   - `entity_version_at_decision == current_entity_version`
3. On mismatch:
   - no side-effect
   - create manual task with reason
   - audit conflict event

## 10. Safe Mode Technical Model
Entry condition:
1. alert severity critical
2. no ACK at 15 min

Enforcement:
1. command policy engine denies scheduling side-effects
2. UI receives global safe mode flag
3. pending commands move to blocked queue with reason

Recovery gates:
1. superadmin ACK present
2. incident ticket in `recovery_in_progress`
3. recovery action logged (runbook step complete)
4. health checks pass for configured stabilization window

## 11. Observability Minimum (by flow)
## 11.1 Required IDs
1. `correlation_id` in every log/event/metric linkage
2. `tenant_id`, `contact_id`, `conversation_id` in operational traces

## 11.2 Key Metrics
1. Ingress:
   - `ack_latency_p95`
   - `ack_to_enqueue_gap`
   - `dedup_rate`
2. Scheduling:
   - `sensitive_action_block_rate`
   - `idempotency_conflict_rate`
3. D-1:
   - `d1_pending_1600_count`
   - `d1_pending_1700_count`
4. Takeover:
   - `takeover_sla_breach_rate`
   - `takeover_active_duration_p95`
5. Replay:
   - `replay_backlog_size`
   - `replay_expired_manual_count`
6. Safe mode:
   - `critical_alert_no_ack_count`
   - `safe_mode_duration`

## 11.3 Critical Alerts
1. No ACK 5 min (warning) and 15 min (safe mode trigger)
2. `ack_to_enqueue_gap` above threshold
3. replay backlog not draining
4. takeover SLA breach

## 12. NFR Mapping to Architecture
1. RNF-001 Security -> RLS + policy engine + deny-by-default guardians.
2. RNF-003 Reliability -> durable inbox + dedup + retries + dead-letter.
3. RNF-004 Performance -> ACK p95 <=2s + query/index budget.
4. RNF-005 Observability -> metrics and structured events above.
5. RNF-006 Resilience -> contingency queue + replay + safe mode.
6. RNF-007 Integrity -> idempotency + version fences + audit.

## 13. Deferred/Accepted Risks (explicit)
1. N8N HA/scaling deferred in this round (known risk from prior decisions).
2. Compensating controls in scope now:
   - command gateway isolation
   - contingency queue and replay fences
   - safe mode enforcement

## 14. Architecture Exit Criteria for Phase 02
1. Contracts F-01..F-06 approved by PO + Tech.
2. Safe mode and replay fences accepted by Ops + QA.
3. Event and command schemas approved for implementation planning.
4. Observability baseline accepted for beta gate.

## 15. Next Artifacts
1. `Docs/Phases/02-Architecture/SEQUENCE_DIAGRAMS_P0_v1.md`
2. `Docs/Phases/02-Architecture/ADR_INDEX_v1.md`
