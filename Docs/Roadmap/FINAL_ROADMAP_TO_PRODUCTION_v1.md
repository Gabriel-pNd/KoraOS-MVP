# Final Roadmap to Production v1

## 1. Metadata
- Projeto: KoraOS MVP
- Data: 2026-02-10
- Dono: pm
- Status: ready-for-po

## 2. Executive summary
- objetivo do roadmap: consolidar a trilha de entrega do estado atual para producao pronta para venda, com gates tecnicos, operacionais e comerciais unificados.
- horizonte medio prazo: M06 -> M08 (`2026-02-10` a `2026-04-10`) para fechar fundacao operacional, estabilizar beta e concluir RC/GA.
- horizonte longo prazo: M09+ (`2026-04-11` a `2026-06-30`) para escalar comercialmente com controle de margem, qualidade e continuidade.

## 3. Milestones consolidados
| Milestone | Janela alvo | Objetivo | Gate de saida | Dono primario | Dependencias criticas |
|---|---|---|---|---|---|
| M06 - Beta operacional | 2026-02-10 a 2026-02-28 | fechar fundacao de producao: staging espelho de prod, adapters reais DB/Redis/queue, DR inicial e observabilidade minima | alvo cloud + secret manager definidos; deploy/rollback staging PASS; restore drill PASS no RPO/RTO; `required-check` + smoke runtime verdes | architect + devops (coordenacao PM) | D-AR-PROD-001/002/005; provisionamento de Supabase/Redis; ownership de incidente definido |
| M07 - Estabilizacao pos-beta | 2026-03-01 a 2026-03-20 | executar beta comercial em ondas com hypercare e estabilizar operacao | 100% cenarios criticos UAT PASS; RTM P0 completa; carga/soak/fault injection aprovados; zero P0 aberto | qa + operations (coordenacao PM) | QA go/no-go ativo; runbooks por severidade; evidence pack operacional |
| M08 - Escala inicial comercial | 2026-03-21 a 2026-04-10 | concluir RC -> GA pronta para venda inicial | release scorecard RC/GA aprovado; seguranca pre-beta concluida; SLO/SLA estabilizados; pacote comercial aprovado | pm + po (suporte qa/devops) | KPI comercial instrumentado; treinamento das clinicas piloto; governanca de waiver ativa |
| M09+ - Expansao e monetizacao | 2026-04-11 a 2026-06-30 | escalar tenants/canais e aumentar margem sem degradar confiabilidade | churn dentro da meta; NPS/CSAT acima do piso; LTV/CAC no alvo; trigger PC-P1-01 monitorado (ou implementado se acionado) | pm + growth + platform | capacidade de infra por onda; contratos com provedores externos; revisao trimestral de pricing e retencao |

## 4. KPI por milestone
| Milestone | KPI | Baseline | Meta | Janela de medicao | Owner |
|---|---|---|---|---|---|
| M06 | `deploy_success_rate_staging` | local apenas | >= 95% por semana | diaria (S1-S3 M06) | devops |
| M06 | `restore_dr_pass_rate` | 0 drills formais | 100% PASS e dentro de RPO/RTO | quinzenal | data-engineer |
| M06 | `% rotas criticas com adapter real` | parcial | 100% das rotas P0 em staging | semanal | architect + backend |
| M07 | `critical_uat_pass_rate` | n/d (inicio beta) | 100% cenarios criticos | por onda de beta | qa |
| M07 | `rtm_p0_coverage` | in_progress | 100% RF/RNF P0 vinculados a teste+evidencia | semanal | qa + po |
| M07 | `incident_p0_count_week` | n/d (coleta em M06) | <= 1 por semana com RCA concluido | semanal | operations + devops |
| M08 | `slo_attainment_rate` | n/d (primeira coleta em M07) | >= 99.0% jornadas criticas | semanal por tenant | devops + qa |
| M08 | `mttr_p0_minutes` | n/d | <= 60 min | semanal | operations |
| M08 | `unit_economics_margin` | n/d | >= piso aprovado pelo PM/PO para escala | quinzenal | pm + financeiro |
| M09+ | `monthly_churn_rate` | baseline M08 | <= 3.0% | mensal | pm + customer success |
| M09+ | `nps_score` | baseline M08 | >= 40 | mensal | pm |
| M09+ | `ltv_cac_ratio` | baseline M08 | >= 3.0 | mensal/trimestral | pm + financeiro |

## 5. Riscos, bloqueios e mitigacoes
| ID | Horizonte | Risco/Bloqueio | Severidade | Impacto | Mitigacao | Trigger |
|---|---|---|---|---|---|---|
| R-RM-001 | medio prazo (M06) | atraso na decisao de target cloud/secret manager | alto | bloqueia staging/prod e comprime cronograma beta | gate executivo com data limite e escalonamento em 24h | decisao nao concluida ate 2026-02-14 |
| R-RM-002 | medio prazo (M06) | adapters reais DB/Redis/queue nao concluirem | alto | invalida testes representativos e posterga beta | priorizacao tecnica dedicada + bloqueio de novas features ate fechar wiring | rotas P0 sem adapter real ate 2026-02-21 |
| R-RM-003 | medio prazo (M06-M07) | restore DR fora de RPO/RTO | alto | impede go de beta/RC por requisito binding | drills recorrentes, ajuste de runbook e reteste obrigatorio | relatorio de restore reprovado |
| R-RM-004 | medio prazo (M07-M08) | findings criticos de seguranca abertos | alto | bloqueia RC/GA e aumenta risco regulatorio | trilha OWASP/authz/RLS/pentest com SLA bloqueante e reteste | finding Critico aberto no gate RC/GA |
| R-RM-005 | medio prazo (M07) | baixa estabilidade operacional no beta em ondas | medio-alto | retrabalho, atraso de GA, queda de confianca do piloto | hypercare por onda, tuning de alertas e limite de rollout por tenant | `incident_p0_count_week > 1` por 2 semanas |
| R-RM-006 | longo prazo (M09+) | indisponibilidade recorrente de provedores externos (Uazapi/OpenAI) | alto | degrada SLA e conversao comercial | timeout budget, fallback humano, replay seguro e comunicacao por tenant | indisponibilidade > 15 min ou erro acima do threshold |
| R-RM-007 | longo prazo (M09+) | custo de IA acima do previsto deteriorar margem | medio-alto | reduz viabilidade de escala e pricing | monitor por tenant, controle de budget e ajuste de politica de uso | custo por atendimento acima do teto por 2 ciclos |
| R-RM-008 | longo prazo (M09+) | trigger de PC-P1-01 (N8N HA) acionar sem capacidade pronta | medio-alto | risco de indisponibilidade recorrente e backlog critico | reservar capacidade de execucao e plano de contingencia pre-aprovado | `>= 2` incidentes P0 em 14 dias ou replay critico por 3 dias |
| R-RM-009 | longo prazo (M09+) | KPI comercial abaixo do piso (churn/NPS/LTV:CAC) | alto | bloqueia expansao e monetizacao sustentavel | gate comercial trimestral e ajuste de onboarding/pricing | 2 medicoes consecutivas fora da meta |

## 6. Go/no-go por milestone
| Milestone | Criterio go | Criterio no-go | Decisor | Evidencia |
|---|---|---|---|---|
| M06 | ambientes dev/staging/prod definidos; deploy+rollback staging PASS; adapters reais P0 em staging; restore DR PASS | qualquer gate tecnico basico ausente (ambiente/rollback/restore/adapters) | architect + devops + pm | `Docs/Roadmap/ARCH_TARGET_PRODUCTION_v1.md`; `Docs/Roadmap/DEVOPS_RELEASE_OPERATIONS_PLAN_v1.md`; `Docs/Roadmap/DATA_READINESS_PLAN_v1.md` |
| M07 | 100% UAT critica PASS; RTM P0 100%; carga/soak/fault PASS; zero P0 aberto | RTM incompleta, restore reprovado, finding critico aberto ou carga/reliability reprovada | qa + pm + po | `Docs/Roadmap/QA_GO_NO_GO_FRAMEWORK_v1.md`; evidence packs O1/O2/O3; status de ciclo |
| M08 | scorecard RC/GA aprovado; SLO/SLA sustentados; seguranca pre-beta concluida; pacote comercial aprovado | scorecard reprovado, P0 aberto, KPI operacional fora do minimo, readiness comercial incompleta | pm + po + qa + devops | scorecard de release, relatorios de seguranca/DR, KPI dashboard de M08 |
| M09+ | churn/NPS/LTV:CAC dentro da meta; operacao estavel por ondas; trigger HA sob controle | 2 ciclos seguidos com KPI comercial abaixo da meta ou incidente critico recorrente sem mitigacao | pm + po + operations + platform | dashboard comercial mensal, tendencia de incidentes, revisao de trigger PC-P1-01 |

## 7. Dependencias externas
| Dependencia | Tipo | Impacto se atrasar | Plano de contingencia | Owner |
|---|---|---|---|---|
| Definicao final de provedor cloud + secret manager | tecnologia | bloqueia pipeline remoto, rotacao de segredos e auditoria de deploy | manter trilha provider-agnostic temporaria e escalar decisao executiva | devops + architect |
| Supabase/Postgres com RLS coverage completo | tecnologia/compliance | risco cross-tenant e bloqueio de go/no-go RC | bloquear promocao sem coverage RLS e executar hardening com checklist | data-engineer + security |
| Redis gerenciado para lock/idempotencia | tecnologia | risco de backlog/replay e degradacao de SLA sob carga | fallback DB controlado + tuning de thresholds + drill recorrente | architect + data-engineer |
| SLA e limites operacionais de Uazapi (canal WhatsApp) | tecnologia/negocio | queda de atendimento e conversao em janelas de indisponibilidade | fallback manual por tenant + comunicacao ativa + fila priorizada | operations |
| SLA de latencia/custo da API OpenAI | tecnologia/negocio | perda de margem e aumento de tempo de resposta | timeout budget, cache/prompt tuning e takeover humano | architect + pm |
| Disponibilidade de fornecedor de pentest externo | compliance | bloqueia gate de seguranca para RC/GA | contratar janela alternativa e antecipar pre-assessment interno | qa + security |
| Engajamento das clinicas piloto (champions e treinamento) | negocio | adocao baixa e dados insuficientes para decisao comercial | rollout em ondas menores + treinamento dedicado + playbook de onboarding | pm + operations |
| Pacote comercial (pricing, contrato, onboarding, suporte) | negocio | impede conversao de beta para venda | versao minima de oferta comercial com clausulas padrao e limite de escopo | pm + po |
| Validacao juridica/LGPD (DPA e politicas de retencao) | negocio/compliance | risco regulatorio e bloqueio de venda B2B | revisao juridica prioritizada e gate de assinatura antes de GA | po + legal |

## 8. Referencias
- `Docs/Roadmap/ANALYST_GAP_ASSESSMENT_v1.md`
- `Docs/Roadmap/ARCH_TARGET_PRODUCTION_v1.md`
- `Docs/Roadmap/DEVOPS_RELEASE_OPERATIONS_PLAN_v1.md`
- `Docs/Roadmap/DATA_READINESS_PLAN_v1.md`
- `Docs/Roadmap/QA_GO_NO_GO_FRAMEWORK_v1.md`
- `Docs/Roadmap/ROADMAP_ORCHESTRATION_PLAN_v1.md`
- `Docs/PRD/12_prd_koraos_mvp_v1.0.md`
- `Docs/PRD/13_prd_review_blindspots_v1.3.md`
- `Docs/Phases/05-Implementation/O1_CYCLE-03_STATUS_v1.md`
- `Docs/Phases/05-Implementation/O2_CYCLE-01_STATUS_v1.md`
- `Docs/Phases/05-Implementation/O3_CYCLE-01_STATUS_v1.md`
