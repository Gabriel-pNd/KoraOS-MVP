# Data Readiness Plan v1

## 1. Metadata
- Projeto: KoraOS MVP
- Data: 2026-02-10
- Dono: data-engineer
- Status: ready-for-qa

## 2. Objetivo
- fechar prontidao de dados para beta/rc/ga com isolamento, confiabilidade e compliance.

## 3. Isolamento e seguranca de dados
| Tema | Estado atual | Estado alvo | Evidencia de validacao | Owner |
|---|---|---|---|---|
| Multi-tenant model | modelo por `tenant_id` definido e contratos de contexto tenant-scoped aprovados | isolamento hard por tenant em todas as entidades multi-tenant com enforce no backend e banco | checklist de tabelas tenant-scoped + validacao de `tenant_id` obrigatorio em rotas criticas | data-engineer + backend |
| RLS policies | requisito binding e arquitetura com RLS obrigatoria, ainda sem pacote final de validacao em staging | 100% das tabelas multi-tenant com policy ativa (deny-by-default para acesso indevido) | relatorio de coverage RLS por tabela + execucao de suite authz/RLS pre-beta | data-engineer + security |
| Teste negativo cross-tenant | obrigatorio no PRD e previsto no gate QA, sem trilha consolidada unica de evidencias | suite negativa automatizada para CRUD critico e tentativa de bypass com credencial privilegiada | relatorio de testes negativos com resultado PASS e evidencia vinculada ao RTM P0 | qa + data-engineer |
| PII em logs/audit | sanitizacao prevista em requisitos, logs estruturados com schema base implementados | redaction consistente de PII em logs/audit e retencao minima por politica LGPD | amostra auditavel de logs redacted + verificacao de retencao e purge automatica | security + data-engineer |

## 4. Migracao e mudanca de schema
| Item | Padrao | Gate tecnico | Rollback | Observacoes |
|---|---|---|---|---|
| Expand/contract | toda mudanca estrutural deve ser aditiva primeiro (expand), com contract apenas apos estabilizacao e backfill | `required-check` verde + dry-run de migracao + migracao em staging com app compativel | script reversivel da fase expand + feature flag para desligar novo caminho + restauracao por snapshot se necessario | sem alteracoes destrutivas diretas em um unico passo |
| Teste de migracao em staging | migracao+rollback em staging e gate obrigatorio de mudanca estrutural | validacao de schema + smoke runtime + testes de regressao de dados + replay/idempotencia | rollback testado no mesmo ciclo com evidencia de retorno a estado anterior | falha de rollback bloqueia promocao para beta/RC |
| Freeze window | janela de freeze para contract/destruicao de coluna e operacoes sensiveis | aprovacao conjunta data-engineer + devops + qa + owner funcional | adiar contract para proxima janela se qualquer gate falhar | preservar compatibilidade entre versoes durante rollout canary |

## 5. Backup, restore e DR
| Componente | RPO | RTO | Frequencia de teste | Evidencia |
|---|---|---|---|---|
| Banco principal | <= 15 min (beta alvo) | <= 60 min | restore drill quinzenal em staging + teste antes de cada marco beta/RC/GA | relatorio de restore com tempo real medido e validacao de consistencia |
| Fila/lock store (Redis + fallback DB) | <= 5 min para locks/fila critica | <= 30 min | drill mensal de falha Redis + validacao de fallback controlado | relatorio de drill com `drill_passed_controlled_continuity` e `invalid_side_effect_count = 0` |
| Artefatos criticos (evidence packs/logs operacionais) | <= 15 min | <= 60 min | teste mensal de recuperacao de artefatos + verificacao de completude | evidencia de restauracao com `evidence_pack_completeness >= 98%` e trilha de auditoria |

## 6. Performance e capacidade
| Cenario | Meta | Resultado esperado | Ferramenta de validacao | Observacoes |
|---|---|---|---|---|
| Pico webhook | ACK p95 <= 2s; sem perda de mensagem; `ack_to_enqueue_gap` p95 <= 2 min | fila drena sem degradacao critica e sem duplicidade de side-effects | suite de carga em staging + metricas operacionais + alarmes matrix | critico se `ack_to_enqueue_gap` p95 > 5 min ou > 20 eventos/15 min |
| Concurrency locks/idempotencia | `redis_fallback_rate <= 5%` em regime normal; `fallback_db_lock_latency_p95 <= 500 ms` | continuidade controlada em falha Redis, com `invalid_side_effect_count = 0` | testes automatizados O2/O3 + drill de falha Redis + relatorio de latencia/fallback | critico se `fallback_db_lock_latency_p95 > 1200 ms` |
| Query critical path | consultas criticas UI/API com p95 <= 500 ms | experiencia operacional estavel sem gargalo em tenant sob carga de beta | `EXPLAIN ANALYZE` em hotpaths + monitor de query p95 por endpoint | ajustar indices/planos antes de RC quando p95 exceder budget |

## 7. Compliance readiness
- LGPD controles:
  - isolamento multi-tenant com RLS obrigatoria e teste negativo de bypass.
  - redaction de PII em logs estruturados e `audit_log`.
  - deny-by-default para acoes sensiveis por responsavel nao verificado.
- Auditoria de acesso:
  - trilha por usuario/tenant/acao/timestamp para operacoes criticas.
  - relatorio periodico de acessos privilegiados (service role, administracao global).
  - evidencia de deploy/migracao vinculada a owner e aprovacao.
- Retencao e descarte:
  - politica minima: sanitizacao de payload processado e purge conforme definicao operacional aprovada.
  - rotinas automatizadas de descarte com prova de execucao e falha rastreavel.
  - backup com ciclo definido e descarte seguro apos expiracao de janela.
- Responsavel por compliance:
  - Data Engineer (execucao tecnica), Security/DPO (governanca), QA (evidencia), PO (aprovacao de risco).

## 8. Riscos e mitigacoes
| ID | Risco | Severidade | Mitigacao | Trigger |
|---|---|---|---|---|
| R-DATA-001 | cobertura RLS incompleta em tabela critica expor risco cross-tenant | alto | inventario de tabelas + gate bloqueante sem policy + teste negativo automatizado | tabela critica sem policy ativa ou teste negativo falho |
| R-DATA-002 | migracao destrutiva sem estrategia expand/contract causar downtime ou perda de dado | alto | padrao obrigatorio expand/contract + freeze window + rollback testado | PR com alteracao destrutiva sem plano reversivel |
| R-DATA-003 | restore fora de RPO/RTO bloquear entrada em beta/RC | alto | drills recorrentes com relatorio e ajuste de runbook por componente | restore test acima da meta ou inconsistente |
| R-DATA-004 | degradacao de lock fallback sob carga gerar fila crescente e atraso operacional | alto | monitorar `fallback_db_lock_latency_p95`, `replay_backlog` e aplicar tuning/capacidade | `fallback_db_lock_latency_p95 > 1200 ms` ou `replay_backlog > 80` |
| R-DATA-005 | dados de teste/fixtures insuficientes comprometer confiabilidade de regressao | medio-alto | fixtures por persona/tenant + reset deterministico em staging | falhas nao reproduziveis entre execucoes |
| R-DATA-006 | deferimento de HA N8N ampliar dependencia de dados de contingencia/replay | medio-alto | manter compensating controls (safe mode + replay fences + observabilidade) e respeitar trigger formal PC-P1-01 | `>= 2` incidentes P0 em 14 dias ou replay critico por 3 dias |

## 9. Referencias
- `Docs/Roadmap/ARCH_TARGET_PRODUCTION_v1.md`
- `Docs/Roadmap/ANALYST_GAP_ASSESSMENT_v1.md`
- `Docs/Roadmap/DEVOPS_RELEASE_OPERATIONS_PLAN_v1.md`
- `Docs/Roadmap/ROADMAP_ORCHESTRATION_PLAN_v1.md`
- `Docs/Handoffs/HANDOFF_2026-02-10_PHASE-05-POST-MERGE-INCREMENTAL_v1.md`
- `Docs/Phases/02-Architecture/ARCHITECTURE_P0_CONTRACTS_v1.md`
- `Docs/Phases/05-Implementation/RUNTIME_DEPLOY_STATUS_CYCLE-01_v1.md`
- `Docs/Phases/05-Implementation/Runbooks/O2_RUNBOOK_UPDATES_CYCLE-01_v1.md`
- `Docs/Phases/05-Implementation/Runbooks/O3_RUNBOOK_UPDATES_CYCLE-01_v1.md`
- `Docs/Phases/05-Implementation/Evidence/O2/S-PC-05-001_evidence_cycle-01_v1.md`
- `Docs/Phases/05-Implementation/Evidence/O3/S-PC-05-002_evidence_cycle-01_v1.md`
- `Docs/PRD/12_prd_koraos_mvp_v1.0.md`
- `Docs/PRD/13_prd_review_blindspots_v1.3.md`
