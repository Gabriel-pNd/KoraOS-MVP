# Product Consolidation Backlog P0 v1

## 1. Metadados
- Projeto: KoraOS MVP
- Fase: 03-Product-Consolidation
- Data: 2026-02-09
- Owner: PO + PM
- Entrada:
  - `Docs/Handoffs/HANDOFF_2026-02-09_PHASE-02-ARCHITECTURE_v1.md`
  - `Docs/Phases/02-Architecture/ARCHITECTURE_P0_CONTRACTS_v1.md`
  - `Docs/Phases/02-Architecture/ADR_INDEX_v1.md`
  - `Docs/PRD/12_prd_koraos_mvp_v1.0.md`

## 2. Objetivo da consolidacao
Consolidar UX + Architecture aprovados em backlog P0 estavel para a Fase 04 (PO Sharding), sem reabrir decisoes D-AR-001..D-AR-007.

Saida desta fase:
1. Itens de backlog consolidados e priorizados.
2. Deltas de criterio de aceite por fluxo critico.
3. Lista de decisoes operacionais finais antes do sharding.

## 3. Regras de consolidacao (congeladas)
1. Ordem causal por `contact_id` e prioridade so para despacho.
2. Replay com fences obrigatorios (TTL + version guard).
3. Safe mode por falta de ACK em 15 min:
   - bloqueia side-effects de agenda
   - mantem ingestao e fila de pendencias
4. Guardian deny-by-default para acao sensivel.
5. N8N HA/scaling permanece deferido nesta rodada (risco aceito).

## 4. Mapeamento ADR -> backlog de produto
| Consolidation ID | ADR | Tema | Impacto | Prioridade |
|---|---|---|---|---|
| PC-P0-01 | D-AR-001 | Causal order x queue priority | Integridade de side-effects | P0 |
| PC-P0-02 | D-AR-002 | Replay fences (TTL + versao) | Confiabilidade operacional | P0 |
| PC-P0-03 | D-AR-003/D-AR-004 | Safe mode e recuperacao auditavel | Resiliencia/operacao | P0 |
| PC-P0-04 | D-AR-005 | Observabilidade por fluxo F-01..F-06 | Deteccao precoce/IR | P0 |
| PC-P0-05 | D-AR-006 | Redis para lock/idempotencia + fallback DB | Estabilidade concorrencial | P0 |
| PC-P1-01 | D-AR-007 | Trilha N8N HA pos-beta | Risco deferido | P1 |

## 5. Backlog consolidado pronto para sharding
| Item | Tipo | Descricao consolidada | Origem PRD/ADR | Owner sugerido | Criterio de pronto |
|---|---|---|---|---|---|
| PC-P0-01 | ajuste P0 | Fluxo de processamento deve garantir commit causal por contato; prioridade nao pode reordenar commit | EP01/EP02 + D-AR-001 | Backend Lead | testes de concorrencia comprovam invariantes |
| PC-P0-02 | ajuste P0 | Replay so executa com TTL valido e versao consistente; expirado/conflito vira tarefa manual | EP01/EP05/EP08 + D-AR-002 | Backend + Ops | relatorio de replay com status `replayed/expired_manual/conflict_blocked` |
| PC-P0-03 | novo P0 transversal | Safe mode tecnico-operacional com gatilho sem ACK em 15 min e recovery auditavel | EP06/EP08 + D-AR-003/004 | DevOps + Ops | playbook + metricas + unblock com trilha auditavel |
| PC-P0-04 | ajuste P0 transversal | Observabilidade minima por fluxo com correlation_id e metricas obrigatorias de fila, takeover, replay, safe mode | EP08 + D-AR-005 | SRE + QA | dashboard e alertas com evidencias por fluxo |
| PC-P0-05 | ajuste P0 infra | Lock/idempotencia com Redis e fallback em DB para degradacao | EP04/EP08 + D-AR-006 | Platform | teste de falha Redis com continuidade controlada |
| PC-P1-01 | item deferido | Plano pos-beta para HA/scaling N8N com gatilhos de reabertura | D-AR-007 | PO + Architect | roadmap registrado com marco e trigger |

## 6. Deltas de criterios de aceite (para stories P0 afetadas)
## 6.1 Delta CA - processamento e concorrencia
1. Toda story de side-effect deve ter criterio explicito de idempotencia + version guard.
2. Toda story de fila deve separar `dispatch_priority` de `commit_order`.

## 6.2 Delta CA - replay
1. Story de replay deve incluir resultados terminais padronizados:
   - replayed
   - expired_manual
   - conflict_blocked
2. Story de replay deve exigir trilha auditavel por evento.

## 6.3 Delta CA - safe mode
1. Entrada em safe mode deve ocorrer em 15 min sem ACK.
2. Saida de safe mode deve exigir:
   - ACK registrado
   - recovery action auditada
   - health checks verdes na janela definida

## 6.4 Delta CA - observabilidade
1. Criterio minimo de logs estruturados com correlation_id.
2. Criterio minimo de alertas para:
   - no ACK critico
   - gap ACK->enqueue
   - takeover SLA breach
   - replay backlog sem drenagem

## 7. Parametros operacionais para fechamento nesta fase
Itens para confirmacao final na consolidacao (antes do sharding):
1. TTL default por intent:
   - schedule/reschedule/cancel = 120 min (proposto)
   - D-1 confirmation action = ate appointment_start - 30 min (proposto)
   - follow-up nao transacional = 24h (proposto)
2. Janela de estabilizacao para sair do safe mode: 10 min de health checks verdes (proposto).
3. Trigger de reabertura do risco N8N HA:
   - >= 2 incidentes P0 de orquestracao em 14 dias, ou
   - replay backlog critico recorrente por 3 dias consecutivos.

## 8. Decisoes de produto que ficam explicitas apos consolidacao
1. A seguranca operacional prevalece sobre velocidade em side-effects sensiveis.
2. Eventos tardios nao podem gerar side-effect automatico sem contexto valido.
3. Modo seguro e comportamento esperado, nao excecao ad-hoc.
4. Risco deferido (N8N HA) permanece rastreado com gatilho objetivo de revisao.

## 9. Pronto para Fase 04 (PO Sharding)
Checklist:
1. Itens PC-P0-01..PC-P0-05 marcados como `approved_for_sharding`.
2. Item PC-P1-01 marcado como `deferred_with_trigger`.
3. Deltas de CA incorporados como padrao de escrita de stories.
4. Parametros operacionais (secao 7) definidos ou registrados como pendencia formal.

## 10. Proximos artefatos recomendados
1. `Docs/Phases/04-PO-Sharding/STORY_SHARDING_PLAN_P0_v1.md`
2. `Docs/Phases/04-PO-Sharding/STORY_TEMPLATE_P0_DELTA_v1.md`
