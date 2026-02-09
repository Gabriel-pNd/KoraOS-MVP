# ADR Index v1 - Phase 02 Architecture

## 1. Scope
This index tracks architecture decisions for P0 flows and frozen constraints.

Reference source:
- `Docs/Phases/02-Architecture/ARCHITECTURE_P0_CONTRACTS_v1.md`

## 2. Decision Register
| ADR ID | Title | Status | Owner | Date | Source |
|---|---|---|---|---|---|
| D-AR-001 | Causal commit order over contact stream; priority only for dispatch | Accepted | Architecture | 2026-02-09 | Contracts v1 |
| D-AR-002 | Replay requires TTL and version revalidation | Accepted | Architecture + Backend | 2026-02-09 | Contracts v1 |
| D-AR-003 | Safe mode blocks scheduling side-effects and keeps ingestion | Accepted | Architecture + DevOps | 2026-02-09 | Contracts v1 |
| D-AR-004 | Safe mode exit requires ACK and auditable recovery action | Accepted | Architecture + Ops | 2026-02-09 | Contracts v1 |
| D-AR-005 | Observability model is flow-centric (F-01..F-06) with correlation IDs | Accepted | Architecture + QA | 2026-02-09 | Contracts v1 |
| D-AR-006 | Redis explicit for lock/idempotency; DB fallback in degraded mode | Accepted | Architecture | 2026-02-09 | Contracts v1 |
| D-AR-007 | N8N HA/scaling deferred in this round (accepted risk) | Accepted (Deferred) | PO + Architecture | 2026-02-09 | Contracts v1 |

## 3. Decision Dependencies
1. D-AR-001 is prerequisite for D-AR-002 and D-AR-005.
2. D-AR-003 and D-AR-004 are coupled and must be released together.
3. D-AR-006 supports D-AR-001 and D-AR-002 reliability expectations.
4. D-AR-007 requires compensating controls from D-AR-002/003/005.

## 4. Open Follow-ups
1. Formalize implementation-level schema for Event Envelope and Command Envelope.
2. Confirm tenant-config defaults for replay TTL by intent.
3. Define stabilization window duration to exit safe mode.
4. Define rollout plan for deferred N8N HA/scaling risk after beta.
