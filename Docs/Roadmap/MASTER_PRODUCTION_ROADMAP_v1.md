# Master Production Roadmap v1

## 1. Metadata
- Projeto: KoraOS MVP
- Data: 2026-02-10
- Dono: aios-master
- Status: approved-for-handoff

## 2. Objetivo
- consolidar todos os artefatos de roadmap em um plano mestre unico e rastreavel.
- fechar uma linha do tempo unica de gates beta -> rc -> ga com criterios objetivos.
- registrar riscos residuais consolidados e plano de mitigacao por owner.

## 3. Fontes consolidadas
1. `Docs/Roadmap/ROADMAP_ORCHESTRATION_PLAN_v1.md`
2. `Docs/Roadmap/ANALYST_GAP_ASSESSMENT_v1.md`
3. `Docs/Roadmap/ARCH_TARGET_PRODUCTION_v1.md`
4. `Docs/Roadmap/DEVOPS_RELEASE_OPERATIONS_PLAN_v1.md`
5. `Docs/Roadmap/DATA_READINESS_PLAN_v1.md`
6. `Docs/Roadmap/QA_GO_NO_GO_FRAMEWORK_v1.md`
7. `Docs/Roadmap/FINAL_ROADMAP_TO_PRODUCTION_v1.md`
8. `Docs/Roadmap/EXECUTION_BACKLOG_FROM_ROADMAP_v1.md`
9. `Docs/Roadmap/IMPLEMENTATION_EXECUTION_PLAYBOOK_v1.md`
10. `Docs/Roadmap/UX_PRODUCTION_READINESS_AUDIT_v1.md` (se executado)

Resultado da consolidacao:
1. fontes 1..10 preenchidas e validadas.
2. etapa UX opcional executada, sem necessidade de waiver.
3. nenhum conflito aberto apos aplicacao das regras canonicas.

## 4. Plano mestre consolidado
| Milestone | Objetivo | Gate de saida | Janela alvo | Owner | Status |
|---|---|---|---|---|---|
| M06 - Beta operacional | fechar foundation de producao (staging/prod target, adapters reais, DR inicial, observabilidade minima) | target cloud + secret manager definidos; deploy/rollback staging PASS; restore dentro de RPO/RTO; `required-check` + smoke runtime verdes | 2026-02-10 a 2026-02-28 | architect + devops + data-engineer | approved_for_execution |
| M07 - Estabilizacao pos-beta | operar beta em ondas com hypercare e confiabilidade sustentada | UAT critica 100% PASS; RTM P0 100%; carga/soak/fault PASS; zero P0 aberto | 2026-03-01 a 2026-03-20 | qa + operations + po | approved_for_execution |
| M08 - Escala inicial comercial | concluir RC -> GA pronta para venda inicial | RC aprovado com scorecard e seguranca pre-beta; GA aprovado com SLO/SLA sustentados e pacote comercial validado | 2026-03-21 a 2026-04-10 | pm + po + qa + devops | approved_for_execution |
| M09+ - Expansao e monetizacao | escalar com controle de margem, qualidade e continuidade | churn/NPS/LTV:CAC dentro da meta; trigger PC-P1-01 monitorado e tratado se acionado | 2026-04-11 a 2026-06-30 | pm + growth + platform | approved_for_execution |

### 4.1 Linha do tempo final (gates beta -> rc -> ga)
| Marco | Data alvo | Gate | Evidencia obrigatoria | Decisores |
|---|---|---|---|---|
| Gate Beta (M06) | 2026-02-28 | readiness operacional minima validada | relatorio staging, relatorio restore, evidencias O1/O2/O3 consolidadas | architect + devops + pm |
| Gate RC (M08-inicio) | 2026-03-30 | hardening tecnico e qualidade aprovados | scorecard RC, RTM P0 completa, relatorios load/soak/fault e OWASP/authz/RLS/pentest | qa + architect + devops + pm |
| Gate GA (M08-fim) | 2026-04-10 | go-live comercial aprovado | scorecard final GA, checklist go/no-go, KPI operacional e comercial baseline | pm + po + qa + devops + operations |

## 5. Log de conflitos e resolucao
| ID | Conflito | Fontes em conflito | Regra aplicada | Resolucao final | Owner |
|---|---|---|---|---|---|
| C-MR-001 | data de RC aparecia como milestone ampla em uma fonte e como gate pontual em outra | `FINAL_ROADMAP_TO_PRODUCTION_v1.md` vs `ARCH_TARGET_PRODUCTION_v1.md` | handoff mais recente + PRD final + gate tecnico detalhado em arquitetura | RC definido como gate em 2026-03-30 dentro da janela M08 (2026-03-21..2026-04-10) | aios-master |
| C-MR-002 | etapa UX opcional poderia ficar em waiver sem avaliacao formal | `ROADMAP_ORCHESTRATION_PLAN_v1.md` vs estado de execucao da etapa 10 | preferir evidencia existente antes de waiver | `UX_PRODUCTION_READINESS_AUDIT_v1.md` executado e integrado ao plano mestre | aios-master + pm + qa |
| C-MR-003 | backlog M06-M08 com itens `RB-*` ainda em `pending_po_approval` | `EXECUTION_BACKLOG_FROM_ROADMAP_v1.md` vs timeline executiva | guardrail de nao executar sem story aprovada | execucao condicionada a aprovacao PO antes da abertura de O-04/O-05/O-06 | po + sm |
| C-MR-004 | ponteiro de handoff mais recente estava na versao incremental anterior | `Docs/Handoffs/LATEST.md` vs consolidacao final | atualizar `LATEST.md` somente apos aprovacao do master roadmap | `LATEST.md` atualizado para handoff final de roadmap | aios-master |

Resultado: consolidacao final sem conflitos abertos.

## 6. Riscos residuais consolidados
| ID | Risco | Severidade | Mitigacao ativa | Trigger | Owner |
|---|---|---|---|---|---|
| R-MR-001 | atraso na decisao de target cloud/secret manager comprimir M06 | alto | gate executivo com prazo fixo, escalonamento imediato e trilha provider-agnostic temporaria | sem decisao formal ate 2026-02-14 | devops + architect |
| R-MR-002 | adapters reais DB/Redis/queue nao entrarem em staging no prazo | alto | prioridade tecnica dedicada, bloqueio de novo escopo e validacao ponta-a-ponta em staging | rotas P0 sem adapter real ate 2026-02-21 | architect + backend + data-engineer |
| R-MR-003 | restore DR reprovar e bloquear gate Beta/RC | alto | drills recorrentes, ajuste de runbook por componente e reteste obrigatorio | restore fora de RPO/RTO | data-engineer + devops + qa |
| R-MR-004 | finding Critico de seguranca aberto no cutoff RC/GA | alto | trilha OWASP/authz/RLS/pentest com SLA bloqueante e reteste formal | finding Critico aberto no gate RC/GA | qa + security + devops |
| R-MR-005 | RTM P0 incompleta gerar decisao subjetiva de release | alto | gate QA bloqueante sem RTM 100% rastreavel e evidence link em CI | requisito P0 sem teste/evidencia vinculada | qa + po |
| R-MR-006 | indisponibilidade de Uazapi/OpenAI impactar UX de atendimento em ondas | alto | timeout budget, fallback humano por tenant, replay seguro e comunicacao ativa | indisponibilidade > 15 min | operations + architect |
| R-MR-007 | gaps UX P0 pre-GA reduzirem adocao clinica | medio-alto | executar backlog UX-001/002/003/005/006/007/009/011 antes do gate GA | qualquer item UX P0 aberto no gate GA | ux + pm + po + qa |
| R-MR-008 | trigger PC-P1-01 acionado durante beta sem capacidade pronta | medio-alto | monitoramento semanal de trigger + plano pre-aprovado de reabertura | `>= 2` incidentes P0 em 14 dias ou replay critico por 3 dias | architect + po + operations |

## 7. Checklist de fechamento
- [x] guardrails validados (D-AR congeladas, PC-P1-01 deferido com trigger, `required-check` ativo)
- [x] milestones consolidados sem conflito aberto
- [x] linha do tempo final beta -> rc -> ga definida com datas e decisores
- [x] backlog executavel alinhado ao roadmap e playbook operacional
- [x] gates de QA/DevOps/Data/UX definidos para release
- [x] handoff final emitido em `Docs/Handoffs/`
- [x] `Docs/Handoffs/LATEST.md` atualizado apos aprovacao do roadmap mestre

## 8. Proxima acao
1. iniciar O-04 somente apos aprovacao PO dos itens `RB-M06-001..004`.
2. executar gate M06 em 2026-02-28 com evidencias de staging e DR.
3. atualizar handoff incremental apos fechamento de cada gate (M06, M07, M08).
