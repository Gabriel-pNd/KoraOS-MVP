# Story Sharding Plan P0 v1

## 1. Metadados
- Projeto: KoraOS MVP
- Fase: 04-PO-Sharding
- Data: 2026-02-09
- Owner: PO
- Status: draft_v1

## 2. Objetivo da fase
Quebrar os itens consolidados PC-P0-01..PC-P0-05 em stories executaveis para a Fase 05, preservando as decisoes tecnicas congeladas e os parametros operacionais aprovados.

Saida desta fase:
1. Stories P0 com DoR completo.
2. Template de story padronizado com deltas de CA obrigatorios.
3. Sequenciamento por ondas para reduzir risco operacional no beta.

## 3. Entradas obrigatorias
1. `Docs/Phases/03-Product-Consolidation/PRODUCT_CONSOLIDATION_BACKLOG_P0_v1.md`
2. `Docs/Phases/02-Architecture/ARCHITECTURE_P0_CONTRACTS_v1.md`
3. `Docs/Phases/02-Architecture/ADR_INDEX_v1.md`
4. `Docs/Handoffs/HANDOFF_2026-02-09_PHASE-03-PRODUCT-CONSOLIDATION_v1.md`

## 4. Regras congeladas para sharding
1. Commit causal por `contact_id`; prioridade so no despacho.
2. Replay com fences (TTL + version guard).
3. Safe mode por falta de ACK em 15 min.
4. Saida do safe mode so com ACK + recovery action + 10 min de health checks verdes.
5. Guardian deny-by-default para acoes sensiveis.
6. Risco N8N HA permanece deferido com trigger de reabertura formal.

## 5. Mapa de origem
| Story Source | Origem consolidada | ADR relacionado |
|---|---|---|
| S-PC-01-* | PC-P0-01 | D-AR-001 |
| S-PC-02-* | PC-P0-02 | D-AR-002 |
| S-PC-03-* | PC-P0-03 | D-AR-003 / D-AR-004 |
| S-PC-04-* | PC-P0-04 | D-AR-005 |
| S-PC-05-* | PC-P0-05 | D-AR-006 |
| S-PC-P1-* | PC-P1-01 (deferido) | D-AR-007 |

## 6. Backlog shard P0 (executavel)
| Story ID | Fonte | Titulo | Owner sugerido | DoR minimo | Dependencias | Onda |
|---|---|---|---|---|---|---|
| S-PC-01-001 | PC-P0-01 | Separar `dispatch_priority` de `commit_order` no fluxo de fila | Backend Lead | contrato de fila fechado + campos definidos + eventos de teste mapeados | nenhuma | O1 |
| S-PC-01-002 | PC-P0-01 | Garantir commit sequencial por `contact_id` em concorrencia | Backend Lead | estrategia de lock/version definida + casos de corrida listados | S-PC-01-001 | O1 |
| S-PC-01-003 | PC-P0-01 | Padronizar idempotencia e `version_guard` nos side-effects | Backend + QA | idempotency key definida + matriz de conflitos pronta | S-PC-01-002 | O1 |
| S-PC-02-001 | PC-P0-02 | Validar TTL por intent antes de replay | Backend | tabela de TTL aprovada na story + regra de expiracao definida | S-PC-01-003 | O1 |
| S-PC-02-002 | PC-P0-02 | Revalidar versao/as_of antes de replay | Backend | regra de comparacao de versao documentada | S-PC-02-001 | O1 |
| S-PC-02-003 | PC-P0-02 | Resultados terminais de replay (`replayed`, `expired_manual`, `conflict_blocked`) | Backend + Ops | contrato de status e fila manual definidos | S-PC-02-002 | O1 |
| S-PC-03-001 | PC-P0-03 | Pipeline de alerta critico sem ACK (superadmin redundante + retry WhatsApp 5/5 min por 30 min) | DevOps | matriz trigger->canal->owner->SLA de ACK aprovada | nenhuma | O1 |
| S-PC-03-002 | PC-P0-03 | Entrada em safe mode em 15 min sem ACK com politicas de bloqueio/enfileiramento | DevOps + Backend | politicas de side-effect bloqueado e fila de pendencias documentadas | S-PC-03-001 | O1 |
| S-PC-03-003 | PC-P0-03 | Mensagem padrao de contingencia e ticket critico para proximo turno | Ops + Product | texto padrao aprovado + rota de ticket definida | S-PC-03-002 | O2 |
| S-PC-03-004 | PC-P0-03 | Saida do safe mode com ACK + recovery action + 10 min health green | DevOps + Ops | checklist de recovery e health checks fechados | S-PC-03-002 | O2 |
| S-PC-04-001 | PC-P0-04 | Logs estruturados com `correlation_id` fim a fim (F-01..F-06) | SRE | esquema minimo de logs e campos obrigatorios definidos | nenhuma | O2 |
| S-PC-04-002 | PC-P0-04 | Alertas operacionais (no ACK, gap ACK->enqueue, takeover SLA breach, replay backlog) | SRE + QA | thresholds iniciais e destinatarios definidos | S-PC-04-001 | O2 |
| S-PC-04-003 | PC-P0-04 | Evidencia operacional por fluxo para triagem/auditoria | SRE + QA | formato de evidence pack fechado | S-PC-04-002 | O3 |
| S-PC-05-001 | PC-P0-05 | Lock/idempotencia com Redis e fallback em DB | Platform | contrato de degradacao e limites de fallback definidos | S-PC-01-003 | O2 |
| S-PC-05-002 | PC-P0-05 | Teste de falha Redis com continuidade controlada e sem side-effect invalido | Platform + QA | plano de falha e criterio de sucesso definidos | S-PC-05-001 | O3 |

## 7. Item deferido (fora do P0 desta fase)
| Item | Status | Trigger de reabertura | Owner |
|---|---|---|---|
| S-PC-P1-001 (N8N HA pos-beta) | deferred_with_trigger | >= 2 incidentes P0 de orquestracao em 14 dias, ou replay backlog critico por 3 dias consecutivos | PO + Architect |

## 8. Deltas de CA obrigatorios por story
1. Conflitos de versao e idempotencia precisam ter resultado terminal explicito.
2. Toda story de fila precisa explicitar separacao entre despacho e ordem de commit.
3. Toda story de replay precisa aplicar TTL + version guard antes de side-effect.
4. Toda story de safe mode precisa declarar entrada, permanencia e saida auditaveis.
5. Toda story precisa declarar sinal de observabilidade e alerta correspondente.

## 9. Gate de transicao para Fase 05
1. Todas as stories P0 com owner nomeado e dependencia clara.
2. Todas as stories P0 com DoR = `ready_for_implementation`.
3. Template de story aplicado sem excecao nas stories O1/O2/O3.
4. Item deferido S-PC-P1-001 visivel com trigger ativo no backlog.

## 10. Aprovacoes pendentes nesta fase
1. Nomeacao final dos owners por story.
2. Priorizacao final por onda (O1/O2/O3) se houver restricao de capacidade.
3. Thresholds iniciais dos alertas operacionais.

## 11. Log de execucao
- 2026-02-09:
  - Onda O1 quebrada em stories individuais.
  - Artefatos criados em `Docs/Phases/04-PO-Sharding/Stories/O1/`.
  - Status atual das stories O1: `ready_for_po_review`.
