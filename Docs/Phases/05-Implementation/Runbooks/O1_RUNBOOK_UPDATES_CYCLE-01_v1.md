# O1 Runbook Updates - Cycle 01

## 1. Objetivo
Consolidar os gatilhos e a resposta operacional das stories implementadas no ciclo 01 da O1 (`S-PC-01-001..003`).

## 2. S-PC-01-001 - Dispatch Priority vs Commit Order
- Trigger warning: `blocked_commit_order_violation >= 3` em 15 min por clinica.
- Trigger critico: `blocked_commit_order_violation >= 10` em 15 min por clinica.
- Acao imediata: congelar side-effects do contato afetado e rerotear para revisao manual.
- Owner on-call: Backend on-call + superadmin.

## 3. S-PC-01-002 - Causal Commit by Contact
- Trigger warning: `p95(waiting_previous_commit_age) > 2 min` por 10 min.
- Trigger critico: `p95(waiting_previous_commit_age) > 5 min` por 10 min ou backlog `> 40`.
- Acao imediata: validar lock store e liberar itens presos por ordem invalida.
- Owner on-call: Backend on-call + Platform on-call.

## 4. S-PC-01-003 - Idempotency and Version Guard
- Trigger warning: `version_conflict_blocked > 2%` em 60 min ou `>= 8/h`.
- Trigger critico: `version_conflict_blocked > 5%` em 60 min ou `>= 20/h`.
- Acao imediata: pausar side-effects da intent afetada e revisar origem de versao.
- Owner on-call: Backend on-call + QA lead.

## 5. Observacoes
1. Nenhum threshold foi alterado neste ciclo.
2. Valores acima refletem o contrato aprovado das stories O1.
