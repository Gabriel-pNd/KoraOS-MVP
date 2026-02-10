# Analyst Gap Assessment v1

## 1. Metadata
- Projeto: KoraOS MVP
- Data: 2026-02-10
- Dono: analyst
- Status: ready-for-architect

## 2. Executive summary
- Estado atual (`as-is`):
  - Dominio P0 implementado com evidencias tecnicas por onda (O1/O2/O3), testes locais e `required-check` como gate de merge.
  - Trilha runtime/deploy iniciada com runtime HTTP, smoke test, Docker/compose local e CI expandido.
  - Bloqueios operacionais para comercializacao permanecem ativos: ambiente remoto (staging/prod) sem definicao final, sem wiring real DB/Redis/queue no runtime e sem pipeline de deploy cloud fechado.
  - PRD v1.5 e revisao blindspots v1.3 definem gates normativos (RTM, DR, scorecard, unit economics, CSAT/NPS/churn, canary/rollback), mas ainda sem consolidacao unica de execucao para go/no-go comercial.
- Estado alvo (`to-be`):
  - Operacao beta->rc->ga com ambientes dev/staging/prod ativos, deploy/rollback auditavel, observabilidade operacional e runbooks de incidente.
  - Qualidade e seguranca com gates objetivos: RTM P0 completo, testes de carga/soak/fault injection, OWASP+authz+pentest, SLA de correcao por severidade, release scorecard obrigatorio.
  - Dados/compliance com RLS validado em fluxo real, migracao+rollback em staging, DR recorrente com RPO/RTO por componente.
  - Readiness comercial com KPI operacional e financeiro governados (formula/fonte/owner/periodicidade), unit economics minimo, hipotese de pricing e onboarding de piloto em ondas.
- Delta principal para producao pronta para venda:
  - O delta nao e mais de logica de dominio; e de maturidade operacional-comercial: transformar uma base tecnicamente valida em release system com evidencias auditaveis de confiabilidade, seguranca, continuidade e viabilidade comercial.

## 3. Matriz de maturidade (0-5)
| Dimensao | Score atual | Score alvo | Gap | Evidencia fonte | Observacoes |
|---|---:|---:|---:|---|---|
| Produto | 2.8 | 4.5 | 1.7 | `Docs/PRD/12_prd_koraos_mvp_v1.0.md`; `Docs/Handoffs/HANDOFF_2026-02-10_PHASE-05-POST-MERGE-INCREMENTAL_v1.md` | Escopo P0 esta claro, mas governanca final de KPI/go-no-go de negocio ainda nao esta operacionalizada no ciclo atual. |
| Arquitetura | 3.2 | 4.6 | 1.4 | `Docs/Phases/05-Implementation/O1_CYCLE-03_STATUS_v1.md`; `Docs/Phases/05-Implementation/O2_CYCLE-01_STATUS_v1.md`; `Docs/Phases/05-Implementation/O3_CYCLE-01_STATUS_v1.md`; `Docs/PRD/13_prd_review_blindspots_v1.3.md` | Contratos e resiliencia de dominio estao fortes; faltam decisoes/implantacao de arquitetura operacional de producao. |
| Operacao/DevOps | 2.1 | 4.5 | 2.4 | `Docs/Phases/05-Implementation/RUNTIME_DEPLOY_STATUS_CYCLE-01_v1.md`; `Docs/Handoffs/HANDOFF_2026-02-10_PHASE-05-POST-MERGE-INCREMENTAL_v1.md` | Runtime/deploy local pronto, mas release remoto, segredos e pipeline cloud ainda bloqueiam beta comercial. |
| Qualidade/QA | 3.0 | 4.7 | 1.7 | `Docs/Phases/05-Implementation/O3_CYCLE-01_STATUS_v1.md`; `Docs/PRD/12_prd_koraos_mvp_v1.0.md`; `Docs/PRD/13_prd_review_blindspots_v1.3.md` | Suite tecnica passa, porem gates normativos (RTM P0, carga/soak, fault injection, scorecard) ainda precisam consolidacao operacional. |
| Seguranca | 2.9 | 4.7 | 1.8 | `Docs/PRD/12_prd_koraos_mvp_v1.0.md`; `Docs/PRD/13_prd_review_blindspots_v1.3.md` | Requisitos de RLS/authz/hardening estao definidos; evidencias pre-beta (OWASP/pentest/rotacao de segredos) ainda nao estao fechadas no roadmap de execucao. |
| Dados/Compliance | 2.7 | 4.6 | 1.9 | `Docs/PRD/12_prd_koraos_mvp_v1.0.md`; `Docs/Phases/05-Implementation/RUNTIME_DEPLOY_STATUS_CYCLE-01_v1.md` | RLS e DR sao requisitos binding; falta prova recorrente de restore com RPO/RTO e operacao com infra real. |
| Comercial readiness | 1.6 | 4.4 | 2.8 | `Docs/PRD/12_prd_koraos_mvp_v1.0.md`; `Docs/PRD/13_prd_review_blindspots_v1.3.md` | Maior lacuna: unit economics, pricing, valor percebido (CSAT/NPS/churn), estrategia de adocao e criterio de escala comercial. |

## 4. Gaps priorizados
| Prioridade | Gap | Impacto | Urgencia | Owner sugerido | Dependencias | Acao recomendada |
|---:|---|---|---|---|---|---|
| 1 | Prontidao operacional incompleta (sem staging/prod final, segredos e deploy cloud) | bloqueia beta/rc/ga e risco de release manual sem rastreabilidade | imediata | devops + architect | decisao de alvo cloud, politica de segredos, estrategia de rollback | fechar arquitetura de ambientes e pipeline CI/CD com gates de promocao por milestone |
| 2 | Runtime sem adaptadores reais de DB/Redis/queue | impede validacao ponta-a-ponta em condicoes de producao | imediata | backend + data-engineer + platform | provisionamento de infra, contratos de integracao, observabilidade | integrar adaptadores reais e executar smoke/e2e em staging com evidencia |
| 3 | Go/no-go sem framework unico (RTM P0, scorecard, SLA de correcao) | risco de decisao subjetiva e regressao para cliente piloto | alta | qa + pm | matriz requisito-teste-evidencia, politica de waiver, owners de SLA | instituir QA go/no-go framework com gate bloqueante para RC/GA |
| 4 | Continuidade/DR sem rotina recorrente comprovada (RPO/RTO + restore test) | risco critico de indisponibilidade prolongada e perda de confianca comercial | alta | data-engineer + devops | runbook DR, agenda de drills, ambiente staging estavel | formalizar DR por componente e bloquear release sem restore aprovado |
| 5 | Governanca comercial insuficiente (unit economics, pricing, CSAT/NPS/churn) | impossibilita decisao de escala de venda com risco financeiro | alta | pm + po | baseline de clinicas piloto, instrumentacao KPI, processo de revisao | criar pacote de business readiness com KPI operacionais e financeiros vinculados a gates |
| 6 | Dependencia concentrada em canal principal e HA deferido (PC-P1-01) | risco de ruptura da promessa de atendimento continuo | media-alta | architect + operations | trigger formal de HA, fallback manual, matriz de comunicacao por tenant | manter deferimento com trigger claro e validar fallback operacional em incidentes reais/simulados |

## 5. Bloqueios reais
| ID | Bloqueio | Tipo | Severidade | Impacto no roadmap | Proposta objetiva |
|---|---|---|---|---|---|
| B-AN-001 | Ambiente alvo de deploy (staging/prod) e segredos operacionais ainda indefinidos | operacao | alto | impede saida da etapa de arquitetura/devops para beta comercial | decisao formal de alvo cloud + secret manager + modelo de promocao ate 2026-02-14 |
| B-AN-002 | Runtime sem wiring de adaptadores reais (DB/Redis/queue) | tecnico | alto | invalida validacao de performance/resiliencia em ambiente representativo | concluir integracao de adaptadores e validar fluxo ponta-a-ponta em staging ate 2026-02-21 |
| B-AN-003 | Ausencia de gate consolidado de qualidade (RTM, scorecard, SLA severidade) | qualidade | alto | risco de liberar release sem evidencia auditavel de requisitos P0 | publicar framework go/no-go com politica de waiver e bloqueio automatico antes de RC |
| B-AN-004 | DR recorrente nao institucionalizado (RPO/RTO por componente + restore drill) | continuidade | alto | risco de bloquear beta por nao conformidade com requisito binding do PRD | executar primeiro restore drill com relatorio aprovado e agenda recorrente ate 2026-02-28 |
| B-AN-005 | Business case de escala sem baseline de unit economics/pilot KPI | comercial | medio-alto | adia decisao de venda e expansao apos piloto | consolidar scorecard comercial (pricing, ROI, CSAT/NPS/churn) no milestone 07 |

## 6. Riscos residuais
| ID | Risco | Severidade | Probabilidade | Mitigacao | Trigger |
|---|---|---|---|---|---|
| R-AN-001 | atraso na definicao de target cloud gera compressao de cronograma beta | alto | media-alta | gate de decisao arquitetural/data limite + escalonamento executivo | sem decisao de ambiente ate 2026-02-14 |
| R-AN-002 | falha de canal externo (WhatsApp/Uazapi) impacta SLA de atendimento | alto | media | fallback operacional manual + matriz de comunicacao por tenant + alertas | indisponibilidade do provedor > 15 min |
| R-AN-003 | requisitos de seguranca pre-beta (OWASP/authz/pentest) nao concluirem no prazo | alto | media | trilha dedicada de seguranca com bloqueio de RC/GA por severidade | findings criticos sem remediacao dentro do SLA |
| R-AN-004 | qualidade de release sem RTM automatizado gerar regressao em fluxos criticos | alto | media | RTM P0 obrigatorio, auditoria de evidencia em CI e waiver com expiracao | release candidata sem cobertura de requisito critico |
| R-AN-005 | DR falhar em restauracao real sob janela alvo | alto | media | drills recorrentes em staging e ajuste de runbook por componente | restore test fora de RPO/RTO aprovado |
| R-AN-006 | desalinhamento entre roadmap final e capacidade operacional das clinicas piloto | medio | media | rollout em ondas, treinamento por papel e kill criteria explicito | aumento de incidentes operacionais no hypercare |

## 7. Dependencias externas
| ID | Dependencia externa | Estado atual | Impacto se falhar | Contingencia prevista | Owner interno |
|---|---|---|---|---|---|
| D-EXT-001 | Provedor de canal WhatsApp (Uazapi) | integrado no desenho alvo, sem trilha completa de contingencia multi-canal | interrupcao de atendimento e queda de conversao | fallback manual + comunicacao ativa por tenant + priorizacao de tickets criticos | operations |
| D-EXT-002 | Plataforma de dados/auth (Supabase/Postgres/RLS) | requisito central para multitenancy e compliance | indisponibilidade ou degradacao afeta todo fluxo core | plano DR com RPO/RTO por componente e restore test recorrente | data-engineer |
| D-EXT-003 | API de IA (OpenAI) | dependencia para atendimento automatizado e classificacao | degradacao de latencia/custo compromete SLA e margem | timeout budget por jornada + fallback para takeover humano + controle de custo por tenant | architect + pm |
| D-EXT-004 | Provedor cloud/secret manager | alvo final ainda nao definido | bloqueia deploy remoto, rotacao de segredos e operacao segura | decisao formal de stack de operacao e trilha provider-agnostic ate fechamento | devops |
| D-EXT-005 | Redis gerenciado para lock/idempotencia HA | dependencia tecnica aprovada no PRD para resiliencia | perda de dedupe/ordem sob carga sem fallback validado | fallback controlado para banco + monitoria de latencia/erro + drill de falha | architect + data-engineer |
| D-EXT-006 | Servico externo de pentest/assessment de seguranca | nao evidenciado no estado atual | risco de entrada em beta sem validacao independente | contratar janela de pentest pre-beta e incorporar findings no gate QA | qa + security |

## 8. Recomendacao de milestones
| Milestone | Objetivo | Gate de saida | Prazo alvo | Observacoes |
|---|---|---|---|---|
| 06 | Fechar fundacao operacional de producao | target cloud definido; segredos operacionais aprovados; adaptadores reais DB/Redis/queue integrados em staging; deploy+rollback de staging validado com `required-check` | 2026-02-28 | milestone tecnico bloqueante para inicio de beta comercial |
| 07 | Executar beta comercial controlado em ondas | 100% cenarios criticos beta aprovados; RTM P0 completa; carga/soak/fault injection com criterio aprovado; restore DR dentro de RPO/RTO; SLA humano por tenant operacional | 2026-03-20 | incluir hypercare e revisao quinzenal de estabilidade/adocao |
| 08 | Consolidar RC->GA pronta para venda | release scorecard aprovado; zero P0 aberto em seguranca/operacao; SLA de correcao por severidade ativo; unit economics + pricing + CSAT/NPS/churn com baseline de decisao comercial | 2026-04-10 | condicao para escalar venda alem das clinicas piloto |

## 9. Referencias usadas
- `Docs/Handoffs/LATEST.md`
- `Docs/Handoffs/HANDOFF_2026-02-10_PHASE-05-POST-MERGE-INCREMENTAL_v1.md`
- `Docs/Phases/05-Implementation/README.md`
- `Docs/Phases/05-Implementation/IMPLEMENTATION_EXECUTION_PLAN_P0_v1.md`
- `Docs/Phases/05-Implementation/O1_CYCLE-03_STATUS_v1.md`
- `Docs/Phases/05-Implementation/O2_CYCLE-01_STATUS_v1.md`
- `Docs/Phases/05-Implementation/O3_CYCLE-01_STATUS_v1.md`
- `Docs/Phases/05-Implementation/RUNTIME_DEPLOY_STATUS_CYCLE-01_v1.md`
- `Docs/PRD/12_prd_koraos_mvp_v1.0.md`
- `Docs/PRD/13_prd_review_blindspots_v1.3.md`
- `Docs/Roadmap/ROADMAP_ORCHESTRATION_PLAN_v1.md`
