# O1 Runbook Updates - Cycle 02

## 1. Objetivo
Consolidar os gatilhos operacionais de replay das stories `S-PC-02-001..003` implementadas no ciclo 02.

## 2. S-PC-02-001 - Replay TTL Validation
- Trigger warning: `expired_manual > 3%` em 60 min.
- Trigger critico: `expired_manual > 8%` em 60 min ou `> 30/h`.
- Acao imediata: verificar atraso de fila/replay e gargalo de processamento.
- Owner on-call: Backend on-call + Ops.

## 3. S-PC-02-002 - Replay Version and AsOf Validation
- Trigger warning: `conflict_blocked > 2%` em 60 min.
- Trigger critico: `conflict_blocked > 5%` em 60 min ou `> 20/h`.
- Acao imediata: revisar drift de versao e origem dos eventos.
- Owner on-call: Backend on-call.

## 4. S-PC-02-003 - Replay Terminal States
- Trigger warning: backlog manual replay `> 30` ou `p95 idade > 15 min`.
- Trigger critico: backlog manual replay `> 80` ou `p95 idade > 30 min`.
- Acao imediata: priorizar fila manual por criticidade da intent e drenar backlog.
- Owner on-call: Ops lead + superadmin.

## 5. Observacoes
1. Thresholds e ownership mantidos conforme stories aprovadas.
2. Nenhuma alteracao de D-AR foi realizada.
