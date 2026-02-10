# Architecture Target Production v1

## 1. Metadata
- Projeto: KoraOS MVP
- Data: 2026-02-10
- Dono: architect
- Status: ready-for-devops

## 2. Objetivo
- definir a arquitetura alvo para release comercial com gates beta -> rc -> ga.

## 3. Estado atual resumido
- Runtime atual:
  - runtime HTTP funcional para execucao de cenarios de contrato (O1/O2/O3), smoke test e suites de dominio validadas.
  - command/flow contracts de arquitetura (D-AR-001..D-AR-006) implementados no dominio com evidencias por story.
- Deploy atual:
  - baseline local com `Dockerfile` + `docker-compose`.
  - CI com `required-check` e smoke runtime.
  - sem pipeline CD remoto fechado para staging/prod.
- Integracoes atuais:
  - integracoes core previstas: Supabase/Postgres (dados/RLS), Redis (lock/idempotencia), Uazapi (canal), OpenAI (IA), N8N (orquestracao).
  - wiring real de DB/Redis/queue no runtime ainda pendente para ambiente de producao.
- Limites atuais:
  - ambiente alvo cloud e secret manager ainda nao definidos.
  - observabilidade operacional ainda parcial (sem stack unica de metricas/logs/alertas por ambiente).
  - DR recorrente com RPO/RTO e restore drill ainda nao institucionalizado.
  - D-AR-007 (PC-P1-01 - N8N HA) permanece deferido com risco aceito e trigger formal.

## 4. Arquitetura alvo de producao
### 4.1 Componentes principais
| Componente | Estado atual | Estado alvo | Acao de transicao | Dono |
|---|---|---|---|---|
| API/Runtime | runtime HTTP com cenarios de contrato e smoke local | runtime de producao com adapters reais, command gateway unico, policy engine e version fences ativos | conectar adapters DB/Redis/queue, consolidar config por ambiente e habilitar deploy imutavel | architect + backend |
| Persistencia | contratos de dominio e RLS definidos; sem trilha completa de migracao/rollback em staging | Postgres/Supabase com RLS obrigatoria, migracao expand/contract e rollback validado em staging | padronizar pipeline de migracao, testes de rollback e auditoria de schema change | data-engineer |
| Fila/Locks | logica de lock/idempotencia implementada e evidenciada em testes | Redis gerenciado para lock/idempotencia com fallback DB, backlog control e replay governado | provisionar Redis gerenciado, medir SLO de fila e formalizar politicas de degradacao | platform + architect |
| Integracoes externas | dependencias mapeadas, contingencia parcial | contratos de integracao com timeout budget, retry/backoff, outbox/replay seguro e modo degradado por provedor | fechar contratos operacionais Uazapi/OpenAI e fallback manual/automatico por tenant | architect + operations |
| Observabilidade | logs e evidencias por story/ciclo; sem scorecard unico | observabilidade flow-centric (F-01..F-06) com correlation_id, metricas SLO, alert matrix e dashboard operacional | implantar stack unica de logs/metrics/alerts e runbooks vinculados por severidade | devops + qa |
| Seguranca | requisitos RNF definidos; trilha pre-beta incompleta | segredos em vault/secret manager, rotacao auditavel, testes OWASP/authz/RLS e pentest pre-beta | institucionalizar security gates bloqueantes para RC/GA | security + qa + devops |
| Continuidade (DR) | safe mode/replay fences definidos; restore recorrente nao executado | DR por componente com RPO/RTO publicado, restore drill recorrente e bloqueio automatico de release em falha critica | executar restore em staging, manter calendario de drills e relatorio de conformidade | data-engineer + devops |

### 4.2 Topologia por ambiente
- Dev:
  - ambiente de desenvolvimento local/ephemero com Docker/compose.
  - dados sinteticos e fixtures por persona/tenant.
  - integracoes externas com sandbox/mock controlado.
- Staging:
  - topologia espelho de prod (DB/Redis/runtime/observabilidade), isolada por tenant de teste.
  - pipeline completo de deploy/rollback, migracao+rollback e restore drill obrigatorios.
  - execucao de carga, soak, fault injection, RTM e seguranca pre-release.
- Prod:
  - runtime stateless em alta disponibilidade horizontal; DB e Redis gerenciados; segredos via vault.
  - N8N sem acesso direto a tabelas base (apenas API/views isoladas), mantendo guardrail de arquitetura.
  - observabilidade completa com on-call, matriz de alertas e governanca de incidentes por tenant.
  - promocao controlada por gates beta->rc->ga e `required-check` ativo.

## 5. Decisoes arquiteturais obrigatorias
| ID | Decisao | Motivo | Impacto | Dependencias | Status |
|---|---|---|---|---|---|
| D-AR-PROD-001 | Fechar alvo cloud + secret manager como baseline unica de ambientes (dev/staging/prod) | eliminar bloqueio operacional B-AN-001 e reduzir drift de deploy | habilita CD remoto, trilha de auditoria e segregacao de configuracao | DevOps plan + aprovacao PO/Platform | mandatory-before-beta |
| D-AR-PROD-002 | Tornar adapters reais (DB/Redis/queue) obrigatorios no runtime de staging | validar arquitetura em condicao representativa de producao | remove bloqueio tecnico B-AN-002 e reduz risco de regressao tardia | provisionamento infra + contratos de integracao | mandatory-before-beta |
| D-AR-PROD-003 | Formalizar SLO por jornada critica e timeout budget por integracao | fechar gap F2-7 e controlar degradacao em incidentes externos | habilita gate tecnico RC e tuning orientado a metrica | observabilidade minima implantada | mandatory-before-rc |
| D-AR-PROD-004 | Padronizar PromptOps com canary + shadow eval + auto-rollback por threshold | fechar gap F2-8 e evitar regressao comportamental de prompt | reduz risco de incidente funcional em rollout de IA | dataset de regressao + CI bloqueante | mandatory-before-rc |
| D-AR-PROD-005 | Instituir DR binding por componente (RPO/RTO + restore recorrente) | cumprir requisito normativo de continuidade (F2-3 binding) | release bloqueada se restore critico falhar | plano de dados + runbook DR | mandatory-before-beta |
| D-AR-PROD-006 | Tornar RTM P0 + release scorecard gates obrigatorios de promocao | fechar gap F3-5/F3-10 e evitar go/no-go subjetivo | cria criterio objetivo para beta, RC e GA | QA framework + CI evidence link | mandatory-before-rc |
| D-AR-PROD-007 | Habilitar trilha de seguranca pre-beta (OWASP/authz/RLS/pentest + SLA por severidade) | cumprir deltas de seguranca do PRD e reduzir risco regulatorio/comercial | bloqueia RC/GA com findings criticos abertos | QA + security + DevOps | mandatory-before-rc |
| D-AR-PROD-008 | Definir modo degradado por dependencia externa com outbox/replay seguro | tratar risco de indisponibilidade Uazapi/OpenAI sem perda de integridade | aumenta continuidade operacional e reduz MTTR | contratos de integracao + observabilidade | mandatory-before-ga |
| D-AR-PROD-009 | Manter D-AR-007 deferido com trigger formal e compensating controls ativos | preservar guardrail de escopo sem perder governanca de risco | evita reabertura ad-hoc de HA N8N e garante criterio objetivo | metricas de incidentes + backlog replay | approved-deferred-with-trigger |

## 6. PC-P1-01 (N8N HA) - estrategia com trigger formal
- Estado atual:
  - `PC-P1-01` permanece `deferred_with_trigger`, conforme backlog consolidado e sharding P0.
  - risco aceito temporariamente, compensado por replay fences, safe mode e observabilidade flow-centric.
- Trigger formal de reabertura:
  1. `>= 2` incidentes P0 de orquestracao em janela de `14 dias`; ou
  2. replay backlog critico recorrente por `3 dias consecutivos`.
- Escopo minimo quando reabrir:
  1. baseline HA N8N com redundancia de workers (active-passive ou equivalente operacional validado).
  2. health checks e failover controlado com runbook auditavel.
  3. isolamento dos fluxos transacionais criticos em command gateway/scheduler backend quando aplicavel.
  4. controle de backlog com priorizacao de mensagens criticas e politica de backpressure por tenant.
- Criterio de aceite:
  1. failover comprovado sem perda de eventos e sem side-effect duplicado em drill controlado.
  2. MTTR do orquestrador dentro de objetivo operacional acordado.
  3. backlog critico drenado dentro da janela operacional definida em runbook.
  4. ausencia de reincidencia dos triggers por uma janela de estabilizacao de 30 dias.

## 7. Plano beta -> rc -> ga
| Milestone | Pre-condicoes | Gate tecnico | Evidencia obrigatoria | Exit criteria |
|---|---|---|---|---|
| Beta | alvo cloud definido; staging operacional; adapters reais conectados; DR inicial habilitado | 100% cenarios criticos beta aprovados; sem P0 aberto em seguranca/agenda/fila; restore test dentro de RPO/RTO | relatorio de smoke/e2e staging; relatorio DR; evidencias de RLS/teste negativo; checklist de onboarding piloto | beta comercial em ondas iniciado com 3 clinicas piloto e hypercare ativo |
| RC | beta em ondas com estabilidade minima; SLO instrumentado; PromptOps governado | carga + soak + fault injection aprovados; RTM P0 completa; release scorecard aprovado para RC | relatorio de carga/soak; matriz RTM requisito->teste->evidencia; relatorio OWASP/authz/pentest; historico de incidentes | release candidate congelada, sem finding critico aberto e pronta para hardening final |
| GA | RC estavel; SLA de correcao por severidade ativo; criterios comerciais minimos definidos | zero P0 aberto; scorecard final aprovado; evidencia de continuidade operacional + degradacao controlada por dependencia externa | scorecard final assinado; relatorio de resiliencia/DR recorrente; evidencias de SLO/SLA e operacao em producao controlada | producao pronta para venda com gate tecnico e operacional fechado |

## 8. Riscos e mitigacoes
| ID | Risco | Severidade | Mitigacao | Trigger |
|---|---|---|---|---|
| R-ARCH-001 | indefinicao tardia do target cloud/segredos compromete milestone beta | alto | decisao arquitetural bloqueante com data limite e escalonamento executivo | sem decisao ate 2026-02-14 |
| R-ARCH-002 | integracao tardia de adapters reais invalida testes de resiliencia | alto | priorizar wiring DB/Redis/queue em staging antes de novas features | sem e2e em staging ate 2026-02-21 |
| R-ARCH-003 | falha de dependencia externa (Uazapi/OpenAI) degradar SLA critico | alto | timeout budget + outbox/replay + fallback humano por tenant | indisponibilidade > 15 min ou erro acima do threshold SLO |
| R-ARCH-004 | deferimento de HA N8N gerar incidentes recorrentes | alto | manter compensating controls e aplicar trigger formal de reabertura sem excecao | trigger PC-P1-01 atingido |
| R-ARCH-005 | falha em restore drill bloquear avancos de release | alto | calendario recorrente de restore + hard gate de release | restore fora de RPO/RTO |
| R-ARCH-006 | gaps de seguranca pre-beta atrasarem RC/GA | alto | trilha dedicada OWASP/authz/pentest com SLA de remediacao bloqueante | finding critico sem correcao no prazo |

## 9. Mapa de transicao (estado atual -> estado alvo)
| Fase | Estado de entrada | Mudanca arquitetural principal | Gate de conclusao | Dono principal | Data-alvo |
|---|---|---|---|---|---|
| T0 - Baseline atual | dominio P0 implementado + runtime local + CI smoke | consolidar diagnostico unico de lacunas operacionais/arquiteturais | `ARCH_TARGET_PRODUCTION_v1.md` aprovado | architect | 2026-02-10 |
| T1 - Foundation de producao | sem staging/prod fechados; sem adapters reais | definir target cloud + segredos + topologia de ambientes + wiring DB/Redis/queue | deploy staging + rollback validos com `required-check` | architect + devops + data-engineer | 2026-02-28 |
| T2 - Beta tecnico controlado | staging ativo e runtime integrado | ativar gates de continuidade, seguranca e qualidade (DR, RTM, OWASP/authz, load/fault) | 100% cenarios criticos beta aprovados e piloto em ondas iniciado | qa + devops + operations | 2026-03-20 |
| T3 - RC hardening | beta com evidencias iniciais e feedback de campo | consolidar SLO por jornada, PromptOps canary/shadow/rollback e scorecard RC | RC sem finding critico aberto e com estabilidade sustentada | architect + qa + pm | 2026-03-30 |
| T4 - GA readiness | RC estavel e governanca ativa | fechar scorecard final, SLA severidade, continuidade operacional e risco residual | GA aprovado tecnicamente e operacionalmente para venda | architect + pm + po | 2026-04-10 |

## 10. Referencias
- `Docs/Roadmap/ANALYST_GAP_ASSESSMENT_v1.md`
- `Docs/Roadmap/ROADMAP_ORCHESTRATION_PLAN_v1.md`
- `Docs/Handoffs/LATEST.md`
- `Docs/Handoffs/HANDOFF_2026-02-10_PHASE-05-POST-MERGE-INCREMENTAL_v1.md`
- `Docs/Phases/02-Architecture/ARCHITECTURE_P0_CONTRACTS_v1.md`
- `Docs/Phases/02-Architecture/ADR_INDEX_v1.md`
- `Docs/Phases/03-Product-Consolidation/PRODUCT_CONSOLIDATION_BACKLOG_P0_v1.md`
- `Docs/Phases/04-PO-Sharding/STORY_SHARDING_PLAN_P0_v1.md`
- `Docs/Phases/05-Implementation/RUNTIME_DEPLOY_INTEGRATION_TRACK_v1.md`
- `Docs/Phases/05-Implementation/RUNTIME_DEPLOY_STATUS_CYCLE-01_v1.md`
- `Docs/PRD/12_prd_koraos_mvp_v1.0.md`
- `Docs/PRD/13_prd_review_blindspots_v1.3.md`
