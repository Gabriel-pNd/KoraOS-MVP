# UX Wireframe Spec P0 v1

## 1. Metadata
- Project: KoraOS MVP
- Phase: 01-UX
- Date: 2026-02-09
- Owner: PO + UX
- Input artifact:
  - `Docs/Phases/01-UX/UX_FLOW_MAP_P0_v1.md`

## 2. Purpose
Define low-fidelity wireframe requirements for P0 operational surfaces, aligned with approved flow map and frozen risk controls.

This spec defines structure, states, and interaction behavior. It does not define visual style system.

## 3. P0 Screens
1. Conversations
2. Pipeline
3. Agenda
4. Operational Inbox
5. Incident Center

## 4. Global UX Rules
1. Critical state visibility first:
   - `takeover_active`
   - `contingency_queueing`
   - `safe_mode_restricted`
2. Sensitive actions (`agendar`, `reagendar`, `cancelar`) must show:
   - enabled/disabled state
   - block reason
   - next valid action
3. Every queue view must expose:
   - priority class
   - item age
   - owner or assignee
4. Every critical transition must be timeline-visible with actor and timestamp.

## 5. Layout and Navigation
Desktop primary layout:
1. Left rail: module navigation.
2. Main area: module content.
3. Right panel (context): details, timeline, and quick actions.

Mobile primary layout:
1. Bottom nav for modules.
2. Single-column content.
3. Detail drawers instead of permanent side panel.

Module order:
1. Conversations
2. Pipeline
3. Agenda
4. Inbox
5. Incidents

## 6. Screen Spec

### 6.1 Conversations
Main jobs:
1. Triage inbound messages.
2. Execute or block sensitive actions correctly.
3. Operate takeover safely.

Core regions:
1. Queue list with filters:
   - priority
   - state
   - waiting time
2. Conversation thread:
   - source badges (`normal`, `contingency/replay`)
   - confirmation prompts
   - blocked action notices
3. Action rail:
   - `takeover`
   - `end takeover`
   - `open ticket`
   - safe mode reason panel

Required states:
1. `active_ai`
2. `awaiting_explicit_confirmation`
3. `takeover_active`
4. `safe_mode_restricted`

Acceptance interactions:
1. On `takeover_active`, AI reply controls are locked.
2. In safe mode, sensitive action buttons are disabled with reason.
3. Ambiguous confirmation opens reconfirmation flow, no side-effect.

### 6.2 Pipeline
Main jobs:
1. Track lead progression.
2. Support controlled manual moves with audit intent.

Core regions:
1. Kanban columns by lead state.
2. Card metadata:
   - age
   - last action
   - next step
3. Card quick actions:
   - move
   - escalate
   - open conversation

Required states:
1. normal progression
2. blocked by guardian permission
3. pending takeover action

Acceptance interactions:
1. Manual move requires reason capture.
2. Blocked cards show explicit unblock path.

### 6.3 Agenda
Main jobs:
1. Show valid availability.
2. Prevent unsafe scheduling actions.

Core regions:
1. Calendar views:
   - day
   - week
   - month
2. Appointment side panel:
   - status
   - confirmation state
   - conflict warnings
3. Action bar:
   - schedule
   - reschedule
   - cancel

Required states:
1. normal
2. conflict detected
3. safe mode blocked
4. pending guardian authorization

Acceptance interactions:
1. No scheduling action can proceed without explicit confirmation state.
2. In safe mode, actions are disabled and routed to pending queue.

### 6.4 Operational Inbox
Main jobs:
1. Process D-1 manual queue.
2. Process replay exceptions and blocked operations.

Core regions:
1. Queue tabs:
   - D-1 pending
   - replay exceptions
   - safe mode blocked
2. Task card:
   - urgency
   - SLA timer
   - CTA set

Required states:
1. created
2. in_progress
3. escalated
4. resolved

Acceptance interactions:
1. At 16:00, D-1 pending appears in inbox.
2. At 17:00, pending tasks show secretary+manager escalation.
3. Replay-expired events convert to manual task automatically.

### 6.5 Incident Center
Main jobs:
1. Handle technical critical alerts.
2. Expose ACK and fail-safe status.

Core regions:
1. Alert list:
   - severity
   - trigger time
   - ACK status
2. Current incident panel:
   - countdown to fail-safe
   - resend timeline (5 min cadence)
3. Recovery actions:
   - acknowledge
   - exit safe mode
   - create follow-up note

Required states:
1. alert_open
2. alert_acknowledged
3. safe_mode_active
4. recovering

Acceptance interactions:
1. Without ACK in 15 min, safe mode state becomes global and visible.
2. Exit safe mode requires ACK + auditable action.

## 7. Component Inventory (P0)
1. Priority badge
2. State badge
3. SLA timer
4. Global critical banner
5. Blocked-action tooltip/reason
6. Timeline event row
7. Queue age indicator
8. Safe mode lock indicator
9. Replay origin label
10. Manual task CTA cluster

## 8. Copy Requirements (P0)
Mandatory copy blocks:
1. Explicit confirmation prompt
2. Guardian permission block reason
3. Safe mode user-facing contingency message
4. Replay informational notice
5. Takeover active banner

Rules:
1. Operational copy must be plain language.
2. No technical jargon in family-facing messages.
3. Block reason must always suggest next action.

## 9. Responsive Rules
Desktop:
1. Three-pane in Conversations (queue, thread, detail).
2. Kanban visible as columns in Pipeline.

Mobile:
1. Queue-first and thread-next pattern in Conversations.
2. Pipeline as stacked cards, not horizontal board.
3. Incident countdown and safe mode banner always pinned.

## 10. Accessibility and Device Baseline
1. Keyboard navigation for all primary actions.
2. Focus-visible for critical controls.
3. Contrast-safe status indicators.
4. Minimum support matrix:
   - Desktop: 1366x768 and above
   - Mobile: 360x800 and above

## 11. Done Criteria for UX Phase Closure
1. Flow map approved by PO (`approved`).
2. Wireframe spec reviewed with Architecture owner.
3. Handoff to Phase 02 generated and versioned.

## 12. Next Artifact
- `Docs/Handoffs/HANDOFF_2026-02-09_PHASE-01-UX_v1.md`
