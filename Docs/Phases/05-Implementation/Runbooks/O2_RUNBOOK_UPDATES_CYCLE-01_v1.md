# O2 Runbook Updates - Cycle 01

## 1. Objetivo
Consolidar gatilhos e resposta operacional das stories O2 implementadas (`S-PC-03-003`, `S-PC-03-004`, `S-PC-04-001`, `S-PC-04-002`, `S-PC-05-001`).

## 2. S-PC-03-003 - Contingency Message and Critical Ticket
- Warning: `contingency_message_delivery_failure_rate > 2%` em 15 min.
- Critico: `contingency_message_delivery_failure_rate > 5%` em 15 min ou `> 10 falhas/h`.
- Acao imediata: validar canal de mensagem, manter ticket critico obrigatorio e abrir fallback manual.

## 3. S-PC-03-004 - Safe Mode Exit Controlled Recovery
- Warning: reentrada em safe mode `>= 2` vezes em 60 min.
- Critico: reentrada `>= 3` em 60 min ou tentativa de saida sem checklist.
- Acao imediata: bloquear novas tentativas de saida e revisar checklist de recovery.

## 4. S-PC-04-001 - Structured Logs F-01..F-06
- Warning: cobertura de `correlation_id < 99.5%` em 15 min.
- Critico: cobertura de `correlation_id < 98%` em 15 min.
- Acao imediata: identificar componente sem propagacao e aplicar rollback/feature flag.

## 5. S-PC-04-002 - Operational Alerts Matrix
- `no_ack_critical_alert`: warning 5 min, alto 10 min, critico 15 min.
- `ack_to_enqueue_gap`: warning `p95 > 2 min`, critico `p95 > 5 min` ou `> 20 eventos` em 15 min.
- `takeover_sla_breach_rate`: warning `> 5%` em 60 min, critico `> 12%` em 60 min.
- `replay_backlog`: warning `> 30` ou `p95 idade > 15 min`; critico `> 80` ou `p95 idade > 30 min`.

## 6. S-PC-05-001 - Redis Lock/Idempotency Fallback DB
- Warning: `redis_fallback_rate > 5%` em 15 min.
- Critico: `redis_fallback_rate > 20%` em 15 min.
- Warning: `fallback_db_lock_latency_p95 > 500 ms`.
- Critico: `fallback_db_lock_latency_p95 > 1200 ms`.

## 7. Observacoes
1. Thresholds e ownership mantidos conforme stories aprovadas.
2. Nenhuma alteracao em D-AR-001..D-AR-007.
