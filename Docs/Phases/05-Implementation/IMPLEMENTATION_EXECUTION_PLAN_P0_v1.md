# Implementation Execution Plan P0 v1

## 1. Metadados
- Projeto: KoraOS MVP
- Fase: 05-Implementation
- Data: 2026-02-10
- Owner: Engineering + PO
- Status: ready_to_start

## 2. Objetivo
Executar as 15 stories P0 aprovadas no sharding (O1/O2/O3) com controle de qualidade, evidencias de aceite e seguranca operacional.

## 3. Escopo desta fase
1. Implementar stories O1 (concorrencia, replay, safe mode entrada).
2. Implementar stories O2 (recuperacao, observabilidade, alertas, fallback).
3. Implementar stories O3 (evidence pack e drill de resiliencia).
4. Registrar evidencias por story e por onda.

Fora de escopo:
1. Reabrir D-AR-001..D-AR-007.
2. Trilha de HA N8N (permanece P1 deferido com trigger).

## 4. Ordem recomendada de execucao
| Sequencia | Onda | Stories | Criterio para abrir a proxima |
|---|---|---|---|
| 1 | O1 | S-PC-01-001..003, S-PC-02-001..003, S-PC-03-001..002 | O1 com CI verde, CAs evidenciados e sem regressao critica |
| 2 | O2 | S-PC-03-003..004, S-PC-04-001..002, S-PC-05-001 | O2 com alertas operacionais validados e recovery controlado |
| 3 | O3 | S-PC-04-003, S-PC-05-002 | evidence pack validado + drill resiliencia aprovado |

## 5. Strategy de implementacao por story
1. Abrir branch por story.
2. Aplicar implementacao minima para cumprir contrato da story.
3. Validar CAs base + CAs delta.
4. Registrar evidencias.
5. Subir PR com CI obrigatorio verde.

## 6. Gates de qualidade
1. Gate de entrada da story:
   - story em `ready_for_implementation`
   - owner definido
   - dependencias desbloqueadas
2. Gate de merge:
   - `required-check` verde
   - sem conflito com guardrails congelados
   - checklist DoD preenchido
3. Gate de onda:
   - todas as stories da onda com evidencia
   - sem risco critico sem owner/mitigacao

## 7. Pacote minimo de evidencia por story
1. Evidencia funcional dos CAs.
2. Evidencia de logs/metricas/alertas aplicaveis.
3. Evidencia de comportamento em erro/degradacao.
4. Evidencia de runbook atualizado quando aplicavel.

## 8. Riscos de execucao e mitigacao
| ID | Risco | Severidade | Mitigacao |
|---|---|---|---|
| R-IMP-001 | Implementacao fugir do contrato aprovado | alto | PR checklist com referencia explicita da story |
| R-IMP-002 | Fadiga de alerta por threshold inicial | alto | tuning controlado por ciclo com aprovacao PO/ops |
| R-IMP-003 | Falha em fallback/recuperacao sob carga | alto | priorizar testes de degradacao e drill O3 |

## 9. Definicao de pronto da fase
1. O1/O2/O3 implementadas com CI verde.
2. CAs de todas as stories P0 evidenciados.
3. Runbooks operacionais atualizados.
4. Handoff da Fase 05 gerado com status e riscos residuais.

## 10. Referencias
- `Docs/Handoffs/HANDOFF_2026-02-10_PHASE-04-PO-SHARDING_v1.md`
- `Docs/Phases/04-PO-Sharding/STORY_SHARDING_PLAN_P0_v1.md`
- `Docs/Phases/05-Implementation/IMPLEMENTATION_KICKOFF_CHECKLIST_P0_v1.md`
