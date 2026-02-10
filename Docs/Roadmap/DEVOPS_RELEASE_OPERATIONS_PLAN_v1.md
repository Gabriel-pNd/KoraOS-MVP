# DevOps Release Operations Plan v1

## 1. Metadata
- Projeto: KoraOS MVP
- Data: 2026-02-10
- Dono: devops
- Status: ready-for-data-engineer

## 2. Objetivo
- definir operacao de release para ambiente comercial com rastreabilidade.

## 3. Estrategia de ambientes
| Ambiente | Objetivo | Dados | Gate de acesso | Owner | Observacoes |
|---|---|---|---|---|---|
| Dev | acelerar desenvolvimento e validacao tecnica de story | sinteticos/fixtures por tenant, sem dado real | branch feature ativa; merge em `main` somente com `required-check` verde | engineering | ambiente efemero/local, sem segredo de prod e sem release comercial |
| Staging | validar release candidata em condicao proxima de producao | mascarados + sinteticos com reset deterministico | deploy apos merge em `main` + `required-check` + aprovacao DevOps para promocao | devops + qa | obrigatorio rodar smoke, migracao+rollback, restore drill, fault injection e RTM P0 |
| Prod | operar comercialmente com confiabilidade e compliance | reais segregados por tenant (RLS) | promocao apenas de RC aprovada com scorecard final + go/no-go formal | devops + operations + po | rollback imediato para versao estavel, sem bypass de gates obrigatorios |

## 4. CI/CD target
### 4.1 CI (`required-check`)
| Check | Obrigatorio | Falha bloqueia merge | Evidencia |
|---|---|---|---|
| Lint | sim | sim | job CI com relatorio de lint anexado |
| Unit/Integration | sim | sim | relatorio de testes automatizados (O1/O2/O3 + runtime) |
| Smoke runtime | sim | sim | execucao `npm run smoke:runtime` com health/list/execute PASS |
| Security checks | sim | sim | checklist OWASP/authz/RLS + scan de dependencias/segredos com evidencias |

Gates adicionais obrigatorios em CI para promover RC/GA:
1. RTM P0 (`RF/RNF -> US -> TC -> evidencia`) atualizada e validada.
2. Build de artefato imutavel por commit SHA.
3. Vinculo entre evidencias de runbook e release candidate.

### 4.2 CD (deploy)
| Etapa | Trigger | Aprovacao | Rollback | Observacoes |
|---|---|---|---|---|
| Deploy staging | merge em `main` com `required-check` verde | devops on-call | redeploy da imagem/tag anterior + rollback de migracao quando aplicavel | incluir smoke, checagem de migracao e verificacao de observabilidade minima |
| Promote RC | janela de release apos staging estavel + carga/soak/fault injection aprovados | qa + architect + devops | voltar para ultima RC estavel sem promover para prod | exige scorecard RC, RTM P0 completa e sem finding critico aberto |
| Deploy prod | tag GA a partir de RC aprovada | po + pm + devops + qa (go/no-go formal) | blue/green para versao anterior + feature flag off + runbook de recuperacao | proibido deploy direto de branch; apenas promocao de artefato ja validado |

## 5. Secrets, config e governanca
| Tema | Padrao definido | Owner | Criticidade | Observacoes |
|---|---|---|---|---|
| Secret management | vault/secret manager por ambiente, segredo fora de repositorio e escopo minimo por servico | devops + security | alta | trilha de uso/rotacao obrigatoria; acesso por papel e aprovacao |
| Rotacao de credenciais | rotacao periodica (max 90 dias) + rotacao emergencial em incidente | security + devops | alta | credencial comprometida bloqueia promocao de release ate substituicao comprovada |
| Auditoria de deploy | log imutavel de deploy (quem, quando, commit, imagem, resultado, rollback) | devops | alta | auditoria obrigatoria para beta/rc/ga e para incidentes P0/P1 |

## 6. Observabilidade e operacao
| Tema | Minimo obrigatorio | Threshold | Acao automatica | Owner |
|---|---|---|---|---|
| Logs estruturados | `correlation_id`, `tenant_id`, `contact_id`, `flow_id`, `status`, `ts` em F-01..F-06 | warning cobertura `< 99.5%` (15 min); critico `< 98%` (15 min) | abrir incidente + ativar rollback/feature flag no componente sem propagacao | sre + qa |
| Metricas de saude | `ack_to_enqueue_gap`, `replay_backlog`, `redis_fallback_rate`, `takeover_sla_breach_rate` | `ack_to_enqueue_gap` warning `p95 > 2 min`, critico `p95 > 5 min` ou `> 20 eventos/15 min` | throttling de carga + escalonamento para DevOps on-call + ativacao de modo degradado | sre + devops |
| Alertas criticos | matriz `no_ack_critical_alert`, safe mode, replay e fallback lock | `no_ack`: warning 5 min, alto 10 min, critico 15 min; `replay_backlog`: warning `>30`, critico `>80` | safe mode aos 15 min sem ACK + abertura de ticket critico + notificacao redundante | superadmin + devops |
| On-call | cobertura tecnica continua para P0 (plataforma), com handoff operacional por tenant | alerta P0 sem ACK interno por `> 5 min` escala automaticamente | escalonamento em cadeia (superadmin -> devops -> gestao) + comunicacao de incidente por tenant | operations + devops |

## 7. Incidentes e rollback
- Runbook de incidente:
  1. classificar severidade (P0/P1/P2) e impacto por tenant.
  2. aplicar acoes imediatas por trigger (no ACK, safe mode, replay backlog, redis fallback).
  3. registrar linha do tempo, owners, evidencias e acao de mitigacao.
  4. executar postmortem com plano de prevencao para repeticao.
- Playbook de rollback:
  1. preferencia por rollback de aplicacao sem perda de dados (promocao reversa da imagem estavel).
  2. migracao de banco via expand/contract; rollback de schema somente em janela controlada.
  3. em falha critica, ativar modo degradado/safe mode e bloquear side-effects sensiveis.
  4. validar smoke + metricas criticas apos rollback antes de encerrar incidente.
- SLA de resposta:
  - P0: ACK operacional <= 5 min; contencao inicial <= 15 min.
  - P1: ACK <= 15 min; contencao inicial <= 60 min.
  - P2: ACK <= 4h uteis.
- SLA de recuperacao:
  - P0: restaurar servico principal <= 60 min ou manter operacao segura em modo degradado.
  - P1: restaurar <= 4h.
  - P2: restaurar <= 1 dia util.

## 8. Riscos e mitigacoes
| ID | Risco | Severidade | Mitigacao | Trigger |
|---|---|---|---|---|
| R-DO-001 | indefinicao do alvo cloud/secret manager atrasar pipeline remoto | alto | gate de decisao arquitetural com data limite e escalonamento executivo | sem decisao formal ate 2026-02-14 |
| R-DO-002 | deploy manual fora do fluxo de promocao gerar drift entre ambientes | alto | bloquear deploy direto em prod e exigir promocao de artefato assinado | tentativa de deploy sem RC aprovada |
| R-DO-003 | falha em restore test critico bloquear entrada em beta | alto | executar restore recorrente em staging com RPO/RTO e relatorio auditavel | restore fora de meta ou sem evidencia |
| R-DO-004 | fadiga de alerta por thresholds iniciais reduzir resposta a incidentes reais | medio-alto | tuning quinzenal com QA/Ops mantendo limites minimos de seguranca | aumento de alertas nao acionaveis > baseline |
| R-DO-005 | deferimento de N8N HA (PC-P1-01) ampliar risco de indisponibilidade | alto | manter compensating controls (safe mode/replay/observabilidade) e aplicar trigger formal de reabertura | `>=2` incidentes P0 em 14 dias ou replay critico por 3 dias |

## 9. Referencias
- `Docs/Roadmap/ARCH_TARGET_PRODUCTION_v1.md`
- `Docs/Roadmap/ANALYST_GAP_ASSESSMENT_v1.md`
- `Docs/Roadmap/ROADMAP_ORCHESTRATION_PLAN_v1.md`
- `Docs/Handoffs/HANDOFF_2026-02-10_PHASE-05-POST-MERGE-INCREMENTAL_v1.md`
- `Docs/Phases/05-Implementation/RUNTIME_DEPLOY_INTEGRATION_TRACK_v1.md`
- `Docs/Phases/05-Implementation/RUNTIME_DEPLOY_STATUS_CYCLE-01_v1.md`
- `Docs/Phases/05-Implementation/IMPLEMENTATION_EXECUTION_PLAN_P0_v1.md`
- `Docs/Phases/05-Implementation/Runbooks/O1_RUNBOOK_UPDATES_CYCLE-03_v1.md`
- `Docs/Phases/05-Implementation/Runbooks/O2_RUNBOOK_UPDATES_CYCLE-01_v1.md`
- `Docs/Phases/05-Implementation/Runbooks/O3_RUNBOOK_UPDATES_CYCLE-01_v1.md`
- `Docs/PRD/12_prd_koraos_mvp_v1.0.md`
- `Docs/PRD/13_prd_review_blindspots_v1.3.md`
