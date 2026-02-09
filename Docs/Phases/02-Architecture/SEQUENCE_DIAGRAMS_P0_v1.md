# Sequence Diagrams P0 v1

## 1. Metadata
- Project: KoraOS MVP
- Phase: 02-Architecture
- Date: 2026-02-09
- Source contracts:
  - `Docs/Phases/02-Architecture/ARCHITECTURE_P0_CONTRACTS_v1.md`

## 2. F-01 Ingress and Triage
```mermaid
sequenceDiagram
    participant WA as WhatsApp Provider
    participant API as Ingress API
    participant INBOX as Durable Inbox
    participant DISP as Dispatcher
    participant PROC as Contact Processor
    participant OBS as Observability

    WA->>API: webhook event
    API->>INBOX: persist event (dedup key)
    INBOX-->>API: persisted
    API-->>WA: 200 ACK
    API->>OBS: emit ack+enqueue metrics
    INBOX->>DISP: queued event
    DISP->>PROC: dispatch by priority
    PROC->>PROC: process in causal order by contact_id
```

## 3. F-02 Qualification to Scheduling
```mermaid
sequenceDiagram
    participant PROC as Contact Processor
    participant CTX as Context Service
    participant AUTH as Guardian Policy
    participant CMD as Command Gateway
    participant SCH as Scheduling Service
    participant AUD as Audit Log

    PROC->>CTX: load contact + guardians + conversation
    CTX-->>PROC: context snapshot
    PROC->>AUTH: validate permission (deny-by-default)
    AUTH-->>PROC: allowed/blocked
    alt blocked
        PROC->>AUD: write blocked reason
    else allowed + explicit confirmation
        PROC->>CMD: create command with idempotency_key
        CMD->>SCH: execute schedule/reschedule/cancel
        SCH-->>CMD: committed
        CMD->>AUD: write side-effect audit
    end
```

## 4. F-03 D-1 Confirmation
```mermaid
sequenceDiagram
    participant SCHED as D-1 Scheduler
    participant API as Messaging API
    participant INBOX as Operational Inbox
    participant NOTIF as Notification Service
    participant AUD as Audit Log

    SCHED->>API: send reminders 09:00-12:00
    API-->>SCHED: delivery status
    SCHED->>AUD: log D-1 run
    alt pending at 16:00
        SCHED->>INBOX: create manual task
    end
    alt pending at 17:00
        SCHED->>NOTIF: alert secretary + manager
    end
    alt still pending next day
        SCHED->>NOTIF: alert 30 min before opening
    end
```

## 5. F-04 Human Takeover
```mermaid
sequenceDiagram
    participant PROC as Contact Processor
    participant TKO as Takeover Service
    participant TCK as Ticketing
    participant AI as AI Reply Engine
    participant AUD as Audit Log

    PROC->>TKO: trigger takeover
    TKO->>TCK: create ticket with context
    TKO->>AI: set ai_silenced=true
    TKO->>AUD: log takeover_active
    loop SLA monitoring
        TKO->>TCK: evaluate deadline
    end
    TCK-->>TKO: resolved by operator
    TKO->>AI: set ai_silenced=false
    TKO->>AUD: log takeover_closed
```

## 6. F-05 Contingency and Replay
```mermaid
sequenceDiagram
    participant DET as Outage Detector
    participant CQ as Contingency Queue
    participant RP as Replay Service
    participant VAL as Version Guard
    participant CMD as Command Gateway
    participant INBOX as Operational Inbox
    participant AUD as Audit Log

    DET->>CQ: enter contingency mode
    CQ->>CQ: buffer inbound events
    DET->>RP: start replay after recovery
    RP->>VAL: check TTL + versions
    alt valid
        RP->>CMD: replay command/event
        CMD-->>RP: committed
        RP->>AUD: mark replayed
    else expired or conflict
        RP->>INBOX: create manual task
        RP->>AUD: mark expired_manual/conflict_blocked
    end
```

## 7. F-06 Safe Mode (no ACK 15 min)
```mermaid
sequenceDiagram
    participant MON as Alert Monitor
    participant WA as WhatsApp Alert Channel
    participant SM as Safe Mode Controller
    participant CMD as Command Gateway
    participant MSG as User Messaging
    participant TCK as Ticketing
    participant AUD as Audit Log

    MON->>WA: send critical alert to superadmin
    loop every 5 min up to 30 min
        WA->>WA: resend alert
    end
    alt no ACK at 15 min
        MON->>SM: enter safe_mode_restricted
        SM->>CMD: block schedule/reschedule/cancel
        SM->>MSG: send contingency message
        SM->>TCK: open critical ticket
        SM->>AUD: log safe mode activation
    else ACK received
        MON->>AUD: log acknowledged
    end
```

## 8. Recovery Sequence (Safe Mode Exit)
```mermaid
sequenceDiagram
    participant OPS as Superadmin/Ops
    participant SM as Safe Mode Controller
    participant HC as Health Checks
    participant CMD as Command Gateway
    participant AUD as Audit Log

    OPS->>SM: ACK + recovery action
    SM->>HC: verify stabilization window
    HC-->>SM: green
    SM->>CMD: unblock side-effects
    SM->>AUD: log safe mode exit
```

## 9. Notes
1. Priority scheduling must never break causal commit order by contact stream.
2. Replay never bypasses version and TTL fences.
3. Safe mode is a command-gating state, not an ingestion stop.
