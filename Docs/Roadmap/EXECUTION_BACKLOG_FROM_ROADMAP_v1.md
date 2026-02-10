# Execution Backlog from Roadmap v1

## 1. Metadata
- Projeto: KoraOS MVP
- Data: 2026-02-10
- Dono: po
- Status: ready-for-sm

## 2. Objetivo
- converter roadmap consolidado em backlog executavel por release/ondas.
- preservar guardrails de execucao (`D-AR-001..D-AR-007`, `PC-P1-01 deferred_with_trigger`, `required-check`).
- detalhar ordem de execucao, dependencias, DoR/DoD e evidencia minima sem alterar ownership/threshold aprovado.

## 3. Mapa epico -> milestone
| Milestone | Epico | Prioridade | Owner | Status |
|---|---|---|---|---|
| M06 | EP-M06-01 Foundation operacional (target cloud, staging, adapters reais, DR inicial) | P0 | architect + devops + data-engineer | planned |
| M06 | EP-M06-02 Consolidacao das stories P0 O1/O2/O3 (S-PC-01..S-PC-05) | P0 | po + engineering (owners de story preservados) | in_progress |
| M07 | EP-M07-01 Beta em ondas + hypercare + RTM/UAT completos | P0 | qa + operations + po | planned |
| M07 | EP-M07-02 Seguranca e resiliencia pre-RC (OWASP/authz/RLS, load/soak/fault) | P0 | qa + devops + security | planned |
| M08 | EP-M08-01 RC/GA hardening (scorecard, freeze, go/no-go formal) | P0 | pm + po + qa + devops | planned |
| M08 | EP-M08-02 Readiness comercial inicial (pricing/contrato/onboarding/suporte) | P0 | pm + po + operations | planned |
| M09+ | EP-M09-01 Expansao e monetizacao controlada por KPI | P1 | pm + growth + platform | planned |

## 4. Backlog por onda
| Onda | Story ID | Titulo | Dependencias | DoR | DoD | Evidencia obrigatoria | Estado |
|---|---|---|---|---|---|---|---|
| O-01 | S-PC-01-001 | Separar `dispatch_priority` de `commit_order` | nenhuma | story em `ready_for_implementation`; owner original preservado (Backend Lead) | `required-check` verde + teste de concorrencia PASS | `Docs/Phases/05-Implementation/Evidence/O1/S-PC-01-001_evidence_cycle-01_v1.md` | ready_for_pr |
| O-01 | S-PC-01-002 | Garantir commit sequencial por `contact_id` | S-PC-01-001 | lock/version strategy definida; owner original preservado (Backend Lead) | sem regressao de ordem causal + CI verde | `Docs/Phases/05-Implementation/Evidence/O1/S-PC-01-002_evidence_cycle-01_v1.md` | ready_for_pr |
| O-01 | S-PC-01-003 | Idempotencia e `version_guard` em side-effects | S-PC-01-002 | idempotency key definida; owner original preservado (Backend + QA) | resultados terminais consistentes + CI verde | `Docs/Phases/05-Implementation/Evidence/O1/S-PC-01-003_evidence_cycle-01_v1.md` | ready_for_pr |
| O-01 | S-PC-02-001..003 | TTL/version guard de replay + status terminais | S-PC-01-003 | regras de replay aprovadas; owner original preservado (Backend/Ops) | replay PASS (`replayed/expired_manual/conflict_blocked`) + CI verde | `Docs/Phases/05-Implementation/Evidence/O1/S-PC-02-001_evidence_cycle-02_v1.md`; `Docs/Phases/05-Implementation/Evidence/O1/S-PC-02-002_evidence_cycle-02_v1.md`; `Docs/Phases/05-Implementation/Evidence/O1/S-PC-02-003_evidence_cycle-02_v1.md` | ready_for_pr |
| O-01 | S-PC-03-001..002 | Alerta critico sem ACK + entrada safe mode em 15 min | S-PC-01-003 | matriz trigger/canal/SLA aprovada; owner original preservado (Superadmin/DevOps/Backend) | trigger de safe mode validado sem violar thresholds aprovados | `Docs/Phases/05-Implementation/Evidence/O1/S-PC-03-001_evidence_cycle-03_v1.md`; `Docs/Phases/05-Implementation/Evidence/O1/S-PC-03-002_evidence_cycle-03_v1.md` | ready_for_pr |
| O-02 | S-PC-03-003..004 | Mensagem de contingencia + saida de safe mode com recovery | S-PC-03-002 | checklist recovery e health checks definido; owner original preservado (Ops/DevOps) | saida de safe mode auditavel com health green | `Docs/Phases/05-Implementation/Evidence/O2/S-PC-03-003_evidence_cycle-01_v1.md`; `Docs/Phases/05-Implementation/Evidence/O2/S-PC-03-004_evidence_cycle-01_v1.md` | ready_for_pr |
| O-02 | S-PC-04-001..002 | Logs estruturados `correlation_id` + matriz de alertas | S-PC-03-002 | schema minimo e thresholds aprovados; owner original preservado (SRE + QA) | cobertura de campos obrigatorios + alertas operacionais PASS | `Docs/Phases/05-Implementation/Evidence/O2/S-PC-04-001_evidence_cycle-01_v1.md`; `Docs/Phases/05-Implementation/Evidence/O2/S-PC-04-002_evidence_cycle-01_v1.md` | ready_for_pr |
| O-02 | S-PC-05-001 | Lock/idempotencia com Redis e fallback DB | S-PC-01-003 | contrato de degradacao definido; owner original preservado (Platform) | fallback controlado sem side-effect invalido | `Docs/Phases/05-Implementation/Evidence/O2/S-PC-05-001_evidence_cycle-01_v1.md` | ready_for_pr |
| O-03 | S-PC-04-003 | Evidence pack operacional por fluxo | S-PC-04-002 | formato de evidence pack fechado; owner original preservado (SRE + QA) | timeline por `correlation_id` reconstituivel | `Docs/Phases/05-Implementation/Evidence/O3/S-PC-04-003_evidence_cycle-01_v1.md` | ready_for_pr |
| O-03 | S-PC-05-002 | Drill de falha Redis com continuidade controlada | S-PC-05-001 | plano de falha aprovado; owner original preservado (Platform + QA) | `invalid_side_effect_count = 0` + drill PASS | `Docs/Phases/05-Implementation/Evidence/O3/S-PC-05-002_evidence_cycle-01_v1.md` | ready_for_pr |
| O-04 | RB-M06-001 | Definir target cloud + secret manager (staging/prod) | nenhuma | item delta criado e aprovado em planejamento PO/PM/Architect | decisao formal registrada com owner/data e sem conflito de guardrail | ADR/ata de decisao + checklist de ambiente | pending_po_approval |
| O-04 | RB-M06-002 | Integrar adapters reais DB/Redis/queue no runtime staging | RB-M06-001 + O-01..O-03 mergeadas | contratos de integracao e smoke de staging definidos | fluxo ponta-a-ponta com persistencia real PASS | relatorio de staging + logs/metricas por fluxo | pending_po_approval |
| O-04 | RB-M06-003 | Pipeline deploy/rollback staging com `required-check` | RB-M06-001 + RB-M06-002 | plano CI/CD e runbook de rollback aprovados | deploy/rollback staging PASS sem drift de artefato | logs de deploy + runbook + auditoria de release | pending_po_approval |
| O-04 | RB-M06-004 | Restore drill inicial dentro de RPO/RTO | RB-M06-003 | runbook DR por componente aprovado | restore PASS dentro de meta binding | relatorio restore assinado por data/devops/qa | pending_po_approval |
| O-05 | RB-M07-001 | Fechar UAT critica 100% + RTM P0 100% | RB-M06-004 | matriz UAT/RTM baseline publicada | nenhum requisito P0 sem teste/evidencia | update RTM + checklist UAT assinado | pending_po_approval |
| O-05 | RB-M07-002 | Carga/soak/fault + seguranca pre-beta | RB-M07-001 | thresholds RC e plano de teste aprovados | relatorios PASS e zero finding critico aberto | relatorio load/soak/fault + OWASP/authz/RLS + pentest | pending_po_approval |
| O-05 | RB-M07-003 | Operar beta em ondas com hypercare e SLA de incidente | RB-M07-002 | plano de ondas e on-call aprovados | ondas beta executadas sem acionar no-go | scorecard beta + incident log + postmortem | pending_po_approval |
| O-06 | RB-M08-001 | RC/GA scorecard, freeze e aprovacao de release candidate | RB-M07-003 | criterios RC/GA e decisores formalizados | scorecard aprovado e sem drift de ambiente/artefato | scorecard assinado + hash de release + checklist RC | pending_po_approval |
| O-06 | RB-M08-002 | Readiness comercial (pricing, contrato, onboarding, suporte) | RB-M07-003 | baseline KPI comercial instrumentado | pacote comercial aprovado por PM/PO e operacao treinada | docs comerciais + registro de treinamento piloto | pending_po_approval |
| O-06 | RB-M08-003 | Go/no-go final de GA e habilitacao de venda inicial | RB-M08-001 + RB-M08-002 | board go/no-go convocado com evidencias minimas | decisao `GO` formal sem bloqueio critico aberto | ata go/no-go + checklist GA completa | pending_po_approval |
| O-07 | RB-M09-001 | Expansao controlada por ondas (novos tenants/canais) | RB-M08-003 | plano de capacidade e onda comercial aprovados | expansao executada sem romper SLO/SLA | dashboard mensal de churn/NPS/LTV:CAC | pending_po_approval |
| O-07 | RB-M09-002 | Monitorar trigger `PC-P1-01` e preparar trilha HA se acionado | RB-M09-001 | trigger formal mantido sem alteracao de threshold | trigger monitorado continuamente com decisao registrada | relatorio de incidentes + decisao PO/Architect | pending_po_approval |

## 5. Regras de governanca
1. nao alterar ownership/threshold sem trilha de aprovacao.
2. nao executar fora de stories aprovadas (`pending_po_approval` nao entra em execucao).
3. manter evidencia de aceite por story.
4. respeitar `required-check` como gate.
5. DoR minimo global: story com owner definido, dependencias desbloqueadas, CA base + delta explicitos, runbook/checklist aplicavel mapeado.
6. DoD minimo global: CI verde, sem regressao critica, evidencia publicada, riscos residuais com owner e data.
7. evidencia minima obrigatoria por story: prova funcional + prova de erro/degradacao + logs/metricas + referencia de runbook/operacao (quando aplicavel).
8. em conflito de prioridade entre backlog e guardrail, prevalece guardrail aprovado.
9. item `PC-P1-01` permanece `deferred_with_trigger`; qualquer antecipacao exige aprovacao formal PO + Architect.

## 6. Riscos de backlog
| ID | Risco | Severidade | Mitigacao | Trigger |
|---|---|---|---|---|
| R-PO-001 | backlog delta M06-M08 sem sharding formal atrasar inicio de execucao | alto | priorizar fatiamento PO/SM dos itens `RB-*` antes do inicio da onda | item `RB-*` sem story aprovada no inicio da onda |
| R-PO-002 | tentativa de alterar owner/threshold de stories aprovadas por pressao de prazo | alto | bloquear mudanca sem trilha formal e registrar decisao | PR/story sugere mudanca sem aprovacao documentada |
| R-PO-003 | dependencias cruzadas O1/O2/O3 com itens de release gerarem retrabalho | medio-alto | manter ordem O-01 -> O-07 e gate de saida por onda | inicio de onda sem fechamento de dependencias criticas |
| R-PO-004 | falta de evidencia minima em stories prontas para merge | alto | checklist de evidencia obrigatoria antes de `ready_for_pr` | story marcada pronta sem evidence file valido |
| R-PO-005 | RTM P0 e scorecard RC/GA incompletos no cutoff de release | alto | gate bloqueante de release e war-room de fechamento | requisito P0 sem vinculacao teste/evidencia |
| R-PO-006 | trigger `PC-P1-01` ser atingido durante beta sem capacidade reservada | medio-alto | plano de contingencia pre-aprovado e monitoramento semanal | `>= 2` incidentes P0 em 14 dias ou replay critico por 3 dias |

## 7. Criterio de pronto por release
| Release | Criterio tecnico | Criterio funcional | Criterio operacional | Criterio de evidencia |
|---|---|---|---|---|
| Beta | staging com adapters reais, deploy/rollback PASS, restore inicial dentro de RPO/RTO | UAT critica 100% para escopo beta em ondas | runbooks ativos, owners de incidente definidos, on-call habilitado | evidence O1/O2/O3 + relatorio staging + relatorio restore |
| RC | carga/soak/fault PASS, seguranca pre-beta sem finding critico, RTM P0 100% | cobertura funcional P0/P1 critica validada sem regressao | scorecard RC aprovado, sem drift de artefato/ambiente | RTM completa + relatorios QA/security/performance + scorecard RC |
| GA | zero P0 aberto, SLO/SLA sustentados, rollback validado | estabilidade sustentada no beta e pacote comercial aprovado | readiness operacional assinada (operacoes + suporte + governanca de waiver) | scorecard final GA + ata go/no-go + dashboards KPI de M08 |

## 8. Referencias
- `Docs/Roadmap/FINAL_ROADMAP_TO_PRODUCTION_v1.md`
- `Docs/Roadmap/ROADMAP_ORCHESTRATION_PLAN_v1.md`
- `Docs/Roadmap/ARCH_TARGET_PRODUCTION_v1.md`
- `Docs/Roadmap/DEVOPS_RELEASE_OPERATIONS_PLAN_v1.md`
- `Docs/Roadmap/DATA_READINESS_PLAN_v1.md`
- `Docs/Roadmap/QA_GO_NO_GO_FRAMEWORK_v1.md`
- `Docs/Phases/03-Product-Consolidation/PRODUCT_CONSOLIDATION_BACKLOG_P0_v1.md`
- `Docs/Phases/04-PO-Sharding/STORY_SHARDING_PLAN_P0_v1.md`
- `Docs/Phases/05-Implementation/IMPLEMENTATION_EXECUTION_PLAN_P0_v1.md`
- `Docs/Phases/05-Implementation/O1_CYCLE-03_STATUS_v1.md`
- `Docs/Phases/05-Implementation/O2_CYCLE-01_STATUS_v1.md`
- `Docs/Phases/05-Implementation/O3_CYCLE-01_STATUS_v1.md`
- `Docs/Handoffs/HANDOFF_2026-02-10_PHASE-05-POST-MERGE-INCREMENTAL_v1.md`
