# QA Go No-Go Framework v1

## 1. Metadata
- Projeto: KoraOS MVP
- Data: 2026-02-10
- Dono: qa
- Status: ready-for-pm

## 2. Objetivo
- definir criterios de go/no-go para beta, rc e ga com rastreabilidade por evidencia.

## 3. Quality gates por milestone
| Milestone | Gate funcional | Gate seguranca | Gate performance | Gate operacao | Status |
|---|---|---|---|---|---|
| Beta | 100% dos cenarios criticos UAT aprovados; sem regressao em fluxos P0 O1/O2/O3 | sem P0 aberto em seguranca/agenda/fila; testes negativos cross-tenant PASS | ACK p95 <= 2s e `ack_to_enqueue_gap` dentro do threshold; sem perda de mensagem | staging validado com deploy/rollback, owners de incidente definidos e runbooks ativos | defined_blocking |
| RC | cobertura funcional P0/P1 critica validada em staging com RTM completa | OWASP + authz/RLS + pentest pre-beta concluido com findings criticos zerados | carga + soak + fault injection aprovados com criterio numerico | release scorecard RC aprovado; sem drift entre ambiente/artefato | defined_blocking |
| GA | estabilidade funcional sustentada no beta em ondas + criterios de saida RC atendidos | zero P0 aberto; politica de waiver sem excecao ativa para risco critico | SLO/SLA de producao estabilizados e monitorados por tenant | scorecard final aprovado + rollback validado + readiness operacional assinada | defined_blocking |

## 3.1 Criterios objetivos de go/no-go
1. `GO`: todos os gates obrigatorios do milestone aprovados, sem excecao de severidade Critico e com evidencia anexada no RTM.
2. `GO_COM_WAIVER`: apenas para severidade Alto/Medio, com owner, justificativa, plano de correcao e data de expiracao; nunca permitido para risco regulatorio/seguranca critico.
3. `NO_GO`: qualquer criterio bloqueante falho (ex.: RTM incompleta para P0, restore fora de RPO/RTO, finding Critico aberto, scorecard nao aprovado).
4. Toda decisao de gate deve registrar: milestone, resultado, data, owners, evidencias e riscos residuais.

## 4. Matriz minima de testes obrigatorios
| Categoria | Escopo minimo | Ferramenta | Frequencia | Falha bloqueia release |
|---|---|---|---|---|
| Unit | regras de dominio por story (O1/O2/O3) e validacao de contratos terminais | `node --test` | por PR + `required-check` | sim |
| Integration | runtime + adapters + fluxos ponta-a-ponta (fila/replay/safe mode/takeover) | suites integradas + runtime smoke | por merge em `main` e por RC | sim |
| E2E | cenarios criticos UAT (qualificacao/agendamento/reagendamento/takeover/follow-up) | harness E2E de staging + checklist UAT | beta e RC | sim |
| Security/AuthZ/RLS | authn/authz por perfil, RLS coverage, teste negativo cross-tenant, OWASP e pentest | suite QA seguranca + checklist OWASP + pentest | beta e RC (reteste em GA) | sim |
| Load/Resilience | carga webhook/fila, soak test, fault injection (Redis/integracoes), fallback SLA | ferramenta de carga + drills O3 + observabilidade | RC e GA (monitoramento continuo) | sim |
| Smoke deploy | health/list/execute runtime + validacao basica de rotas criticas apos deploy/rollback | `npm run smoke:runtime` + smoke de ambiente | toda promocao staging/RC/prod | sim |

## 5. Politica de severidade e SLA
| Severidade | Definicao | SLA correcao | Pode liberar com waiver | Exige reteste |
|---|---|---|---|---|
| Critico | risco de seguranca/compliance, perda de dado, indisponibilidade severa, side-effect invalido | iniciar contencao <= 15 min; correcao <= 24h | nao | sim, bloqueante |
| Alto | impacto relevante em fluxo critico, degradacao forte de desempenho, falha de confiabilidade sem perda total | correcao <= 72h | sim, somente com expiracao <= 7 dias e aprovacao QA+PO+Tech | sim |
| Medio | impacto parcial sem quebra de fluxo critico, risco controlavel com contorno operacional | correcao <= 14 dias | sim, com owner e backlog priorizado | sim, amostral ou automatizado conforme risco |
| Baixo | problema cosmetico/nao critico sem risco operacional relevante | correcao <= 30 dias | sim | nao obrigatorio, recomendado |

Regras adicionais de waiver:
1. waiver nao substitui evidencia; apenas formaliza risco residual temporario.
2. waiver vencido reabre automaticamente o gate como `NO_GO` se nao houver correcao.
3. qualquer waiver de seguranca exige reteste documentado antes de RC/GA.

## 6. RTM (requisito -> teste -> evidencia)
| Requisito/Story | Caso de teste | Evidencia esperada | Arquivo/link | Status |
|---|---|---|---|---|
| D-AR-001 / S-PC-01-001 | `dispatch_priority` nao altera `commit_order` em concorrencia | PASS em cenarios de ordem causal + log estruturado de correlacao | `Docs/Phases/05-Implementation/Evidence/O1/S-PC-01-001_evidence_cycle-01_v1.md` | pass_local |
| D-AR-002 / S-PC-02-001 | replay fora de TTL gera `expired_manual` e nao side-effect | PASS em teste de TTL e borda D-1 | `Docs/Phases/05-Implementation/Evidence/O1/S-PC-02-001_evidence_cycle-02_v1.md` | pass_local |
| D-AR-003 / S-PC-03-001 | sem ACK no SLA escala alerta e aciona retries 5/5 ate 30 min | PASS + logs com trigger/canal/tentativa/ACK | `Docs/Phases/05-Implementation/Evidence/O1/S-PC-03-001_evidence_cycle-03_v1.md` | pass_local |
| D-AR-004 / S-PC-03-004 | saida de safe mode so com checklist e recovery controlado | PASS em cenarios de reentrada e saida controlada | `Docs/Phases/05-Implementation/Evidence/O2/S-PC-03-004_evidence_cycle-01_v1.md` | pass_local |
| D-AR-005 / S-PC-04-001 | cobertura de `correlation_id` fim a fim F-01..F-06 | PASS de schema/correlacao + cobertura de campos obrigatorios | `Docs/Phases/05-Implementation/Evidence/O2/S-PC-04-001_evidence_cycle-01_v1.md` | pass_local |
| D-AR-005 / S-PC-04-002 | matriz de alertas operacionais dispara e encerra sem duplicidade | PASS para no ACK, gap enqueue, takeover SLA, replay backlog | `Docs/Phases/05-Implementation/Evidence/O2/S-PC-04-002_evidence_cycle-01_v1.md` | pass_local |
| D-AR-006 / S-PC-05-001 | falha Redis ativa fallback DB sem side-effect duplicado | PASS de lock fallback + relatorio de fallback rate e p95 | `Docs/Phases/05-Implementation/Evidence/O2/S-PC-05-001_evidence_cycle-01_v1.md` | pass_local |
| Resiliencia / S-PC-05-002 | drill de falha Redis preserva continuidade controlada | PASS com `invalid_side_effect_count = 0` | `Docs/Phases/05-Implementation/Evidence/O3/S-PC-05-002_evidence_cycle-01_v1.md` | pass_local |
| Evidencia operacional / S-PC-04-003 | evidence pack reconstrui timeline por `correlation_id` | PASS em completude e rastreabilidade para triagem QA | `Docs/Phases/05-Implementation/Evidence/O3/S-PC-04-003_evidence_cycle-01_v1.md` | pass_local |
| PRD v1.5 - DR binding (RPO/RTO + restore) | restore test em staging dentro de meta por componente | relatorio de restore aprovado e anexado ao gate beta/RC | `Docs/Roadmap/DATA_READINESS_PLAN_v1.md` | pending_execution |
| PRD v1.5 - seguranca pre-beta | OWASP + authz/RLS + pentest com findings criticos zerados | checklist completo + relatorio de reteste de correcoes | `Docs/Roadmap/DEVOPS_RELEASE_OPERATIONS_PLAN_v1.md` | pending_execution |
| PRD v1.5 - RTM P0 obrigatoria | vinculacao RF/RNF -> US -> TC -> evidencia validada em CI | RTM completa sem lacuna para escopo P0 | `Docs/Roadmap/QA_GO_NO_GO_FRAMEWORK_v1.md` | in_progress |

## 7. Go/no-go checklist final
- [ ] Cenarios criticos UAT 100% aprovados
- [ ] Sem P0 aberto em seguranca/agenda/fila
- [ ] Evidencias tecnicas e operacionais anexadas
- [ ] Plano de rollback validado
- [ ] Donos de incidente e SLA confirmados

## 8. Riscos e mitigacoes
| ID | Risco | Severidade | Mitigacao | Trigger |
|---|---|---|---|---|
| R-QA-001 | RTM incompleta para escopo P0 gerar decisao subjetiva de release | alto | gate bloqueante para RC/GA sem RTM 100% rastreavel | requisito P0 sem teste/evidencia vinculada |
| R-QA-002 | falha em restore test nao ser tratada como bloqueio de beta | alto | marcar restore fora de RPO/RTO como `NO_GO` automatico | relatorio de restore reprovado ou ausente |
| R-QA-003 | waiver sem expiracao virar divida cronica de qualidade | medio-alto | politica obrigatoria de expirar waiver + reteste mandatorio | waiver vencido sem correcao |
| R-QA-004 | findings criticos de seguranca escaparem por excecao informal | alto | proibir waiver para Critico e exigir reteste com evidencia | finding Critico aberto em milestone RC/GA |
| R-QA-005 | cobertura de resiliencia insuficiente para dependencias externas | medio-alto | incluir fault injection e testes de fallback com SLA no gate RC | teste de resiliencia nao executado no milestone |

## 9. Referencias
- `Docs/Roadmap/DEVOPS_RELEASE_OPERATIONS_PLAN_v1.md`
- `Docs/Roadmap/DATA_READINESS_PLAN_v1.md`
- `Docs/Roadmap/ARCH_TARGET_PRODUCTION_v1.md`
- `Docs/Roadmap/ANALYST_GAP_ASSESSMENT_v1.md`
- `Docs/Roadmap/ROADMAP_ORCHESTRATION_PLAN_v1.md`
- `Docs/PRD/12_prd_koraos_mvp_v1.0.md`
- `Docs/PRD/13_prd_review_blindspots_v1.3.md`
- `Docs/Phases/05-Implementation/O1_CYCLE-03_STATUS_v1.md`
- `Docs/Phases/05-Implementation/O2_CYCLE-01_STATUS_v1.md`
- `Docs/Phases/05-Implementation/O3_CYCLE-01_STATUS_v1.md`
- `Docs/Phases/05-Implementation/Evidence/O1/S-PC-01-001_evidence_cycle-01_v1.md`
- `Docs/Phases/05-Implementation/Evidence/O1/S-PC-02-001_evidence_cycle-02_v1.md`
- `Docs/Phases/05-Implementation/Evidence/O1/S-PC-03-001_evidence_cycle-03_v1.md`
- `Docs/Phases/05-Implementation/Evidence/O2/S-PC-03-004_evidence_cycle-01_v1.md`
- `Docs/Phases/05-Implementation/Evidence/O2/S-PC-04-001_evidence_cycle-01_v1.md`
- `Docs/Phases/05-Implementation/Evidence/O2/S-PC-04-002_evidence_cycle-01_v1.md`
- `Docs/Phases/05-Implementation/Evidence/O2/S-PC-05-001_evidence_cycle-01_v1.md`
- `Docs/Phases/05-Implementation/Evidence/O3/S-PC-04-003_evidence_cycle-01_v1.md`
- `Docs/Phases/05-Implementation/Evidence/O3/S-PC-05-002_evidence_cycle-01_v1.md`
