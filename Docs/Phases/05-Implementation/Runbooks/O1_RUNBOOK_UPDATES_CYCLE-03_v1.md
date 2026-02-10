# O1 Runbook Updates - Cycle 03

## 1. Objetivo
Consolidar os gatilhos operacionais de alerta critico sem ACK e entrada em safe mode (`S-PC-03-001..002`).

## 2. S-PC-03-001 - Critical Alert Pipeline (No ACK)
- Trigger tecnico: `no_ack_critical_alert`.
- Limiar warning: sem ACK em 5 min.
- Limiar alto: sem ACK em 10 min.
- Limiar critico/fail-safe: sem ACK em 15 min (acionar S-PC-03-002).
- Acao imediata: validar canais ativos e acompanhar retries.
- Owner on-call: superadmin.

## 3. S-PC-03-002 - Safe Mode Entry on No ACK
- Trigger tecnico hard: `ack_timeout_15m`.
- Warning: `safe_mode_duration > 20 min` ou `contingency_queue > 50`.
- Critico: `safe_mode_duration > 45 min` ou `contingency_queue > 120` ou `oldest_pending > 30 min`.
- Acao imediata: confirmar ativacao de safe mode, comunicar operacao e priorizar pendencias.
- Owner on-call: superadmin + DevOps on-call.

## 4. Observacoes
1. Sem alteracao de thresholds aprovados nas stories.
2. Fluxo de saida de safe mode permanece fora da O1 (S-PC-03-004 na O2).
