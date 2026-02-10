# Roadmap Orchestration Plan v1

## 1. Metadata
- Projeto: KoraOS MVP
- Data: 2026-02-10
- Dono: aios-master
- Status: ready-for-execution

## 2. Objetivo da orquestracao
- Orquestrar a execucao multiagente para transformar o estado atual da `Phase 05` (pos-merge incremental) em um roadmap mestre unico, rastreavel e executavel ate producao pronta para venda (beta -> rc -> ga), sem violar os guardrails aprovados.

## 3. Entradas obrigatorias
1. `Docs/Handoffs/LATEST.md`
2. `Docs/Handoffs/HANDOFF_2026-02-10_PHASE-05-POST-MERGE-INCREMENTAL_v1.md`
3. `Docs/Phases/README.md`
4. `Docs/PRD/12_prd_koraos_mvp_v1.0.md`
5. `Docs/PRD/13_prd_review_blindspots_v1.3.md`
6. `Docs/Roadmap/AGENT_PROMPTS_FILL_PACK_v1.md`
7. `Docs/Phases/05-Implementation/README.md`
8. `Docs/Phases/05-Implementation/RUNTIME_DEPLOY_INTEGRATION_TRACK_v1.md`
9. `Docs/Phases/05-Implementation/RUNTIME_DEPLOY_STATUS_CYCLE-01_v1.md`

## 4. Sequencia de execucao multiagente
| Ordem | Agente | Entrega | Entrada minima | Criterio de aceite | Fallback se bloquear |
|---|---|---|---|---|---|
| 1 | aios-master | `Docs/Roadmap/ROADMAP_ORCHESTRATION_PLAN_v1.md` | docs base (secao 3) | plano preenchido sem placeholders, com sequencia, dependencias, contingencia, criterio de conclusao e riscos iniciais | reduzir escopo para trilha obrigatoria (1-9 e 11), mantendo 10 opcional sob waiver formal |
| 2 | analyst | `Docs/Roadmap/ANALYST_GAP_ASSESSMENT_v1.md` | secao 3 + saida 1 | matriz de maturidade 0-5 completa; gaps priorizados com impacto/urgencia/owner; bloqueios reais com proposta objetiva; referencias rastreaveis | registrar premissas explicitas por gap e escalar lacunas de informacao para PM/PO com prazo de resposta |
| 3 | architect | `Docs/Roadmap/ARCH_TARGET_PRODUCTION_v1.md` | saidas 1-2 + PRD final | arquitetura alvo com mapa atual->alvo; decisoes tecnicas para riscos altos pendentes (ex.: SLO, canary/rollback, HA deferido); plano formal de trigger para PC-P1-01 | manter baseline atual (runtime + compose) com ADRs pendentes e bloqueio explicito de GA ate decisoes de infraestrutura |
| 4 | devops | `Docs/Roadmap/DEVOPS_RELEASE_OPERATIONS_PLAN_v1.md` | saidas 1-3 + handoff atual | estrategia dev/staging/prod; pipeline CI/CD com `required-check` + smoke runtime + gates de deploy; plano de rollback/incidente com metricas operacionais | produzir plano provider-agnostic e abrir gate de decisao obrigatoria para alvo cloud antes de RC |
| 5 | data-engineer | `Docs/Roadmap/DATA_READINESS_PLAN_v1.md` | saidas 1-3 + PRD final | isolamento multi-tenant/RLS com validacao negativa; migracao expand/contract com rollback; backup/restore/DR com RPO/RTO e criterios verificaveis | executar trilha minima em staging com restore drill recorrente e registrar gaps para fechamento antes de beta comercial |
| 6 | qa | `Docs/Roadmap/QA_GO_NO_GO_FRAMEWORK_v1.md` | saidas 1-5 + PRD final | matriz de testes beta/rc/ga; criterios objetivos de go/no-go; politica de severidade + SLA de correcao + waiver controlado; RTM requisito->teste->evidencia para P0 | ativar protocolo temporario de evidencia manual auditavel, sem liberar RC enquanto RTM automatizado estiver incompleto |
| 7 | pm | `Docs/Roadmap/FINAL_ROADMAP_TO_PRODUCTION_v1.md` | saidas 1-6 | milestones com objetivo/gate/dono/data; KPI com formula/fonte/owner/periodicidade; dependencias criticas negocio+tecnologia; riscos por horizonte | usar marcos relativos com deadline de decisao e manter bloqueios explicitamente sinalizados no cronograma |
| 8 | po | `Docs/Roadmap/EXECUTION_BACKLOG_FROM_ROADMAP_v1.md` | saidas 1-7 + stories aprovadas | backlog por milestone/release com ordem e dependencia; DoR/DoD/evidencia minima; criterio de pronto por release; sem alterar ownership/threshold aprovado | gerar backlog delta (sem sobrescrever baseline) e elevar conflitos para decisao formal antes de execucao |
| 9 | sm | `Docs/Roadmap/IMPLEMENTATION_EXECUTION_PLAYBOOK_v1.md` | saidas 1-8 + fase 05 | cadencia de ciclos e ritos; padrao branch/pr/merge/checks com `required-check`; rotina de evidencias/runbooks/status; protocolo de risco/bloqueio/escalonamento | aplicar modo de execucao conservador (ondas menores + limite de WIP) ate estabilizar throughput e riscos |
| 10 | ux-design-expert (opcional) | `Docs/Roadmap/UX_PRODUCTION_READINESS_AUDIT_v1.md` | saidas 1-9 + contexto produto | gaps UX criticos para operacao real; acessibilidade/responsividade e risco de adocao; backlog de correcao pre-GA; criterio de aceite UX para go-live | se nao houver capacidade dedicada, executar auditoria heuristica enxuta por PM+QA e registrar waiver de risco UX |
| 11 | aios-master | `Docs/Roadmap/MASTER_PRODUCTION_ROADMAP_v1.md` | saidas 1-9 + 10 (ou waiver) | consolidacao final sem conflito; timeline final beta->rc->ga; riscos residuais com mitigacao/owner/data; checklist de fechamento para handoff | bloquear consolidacao final e emitir lista de conflitos com dono/prazo ate resolucao documental |

## 5. Dependencias entre etapas e caminhos de contingencia
| ID | Dependencia | Impacto se falhar | Caminho de contingencia | Owner de destravamento |
|---|---|---|---|---|
| DEP-ORC-001 | Etapa 2 depende da Etapa 1 completa | analise inicia sem criterio unico e gera retrabalho em cascata | usar versao congelada da Etapa 1 e abrir errata controlada antes da Etapa 7 | aios-master |
| DEP-ORC-002 | Etapa 3 depende dos gaps priorizados da Etapa 2 | arquitetura pode omitir riscos de maior impacto | assumir top 5 gaps do PRD final/handoff e marcar decisoes como provisoria | architect |
| DEP-ORC-003 | Etapas 4 e 5 dependem de direcao tecnica da Etapa 3 | plano de release/dados fica desconectado de arquitetura alvo | executar trilha minima de operacao/dados baseada no estado atual (runtime + compose) e bloquear GA | devops + data-engineer |
| DEP-ORC-004 | Etapa 6 depende de 4 e 5 para criterios verificaveis | go/no-go vira subjetivo e sem evidencia auditavel | aplicar go/no-go parcial apenas para beta interno e impedir RC/GA | qa |
| DEP-ORC-005 | Etapa 7 depende de 2-6 consolidadas | roadmap final perde confiabilidade de prazo/gate | emitir roadmap com marcos condicionais e bloqueios explicitos por dependencia | pm |
| DEP-ORC-006 | Etapa 8 depende de 7 + guardrails de ownership/threshold | backlog pode conflitar com stories aprovadas | gerar apenas backlog delta e submeter conflitos ao PO para decisao formal | po |
| DEP-ORC-007 | Etapa 9 depende de 8 para cadencia executavel | playbook fica teorico e nao operavel | definir execucao por ondas com WIP conservador ate backlog estabilizar | sm |
| DEP-ORC-008 | Etapa 10 depende de 7-9, mas e opcional | risco UX pode ficar invisivel ate pre-go-live | waiver formal com criterios de risco e auditoria heuristica minima | pm + qa |
| DEP-ORC-009 | Etapa 11 depende de todas as obrigatorias (1-9) e 10 ou waiver | impossibilidade de fechar handoff final | congelar versao candidata, abrir lista unica de conflitos e rodar ciclo de resolucao rapido | aios-master |

## 6. Guardrails de execucao
1. nao reabrir D-AR-001..D-AR-007 sem impacto concreto, decisao formal e rastreio documental.
2. manter PC-P1-01 (N8N HA) deferido com trigger formal; qualquer antecipacao exige nova decisao registrada.
3. manter `required-check` como gate obrigatorio de merge e de promocao entre milestones.
4. nao alterar ownership/threshold sem trilha de aprovacao formal.
5. em conflito documental, priorizar handoff mais recente + PRD final vigente.

## 7. Log inicial de riscos de coordenacao
| ID | Risco | Severidade | Mitigacao inicial | Trigger |
|---|---|---|---|---|
| R-ORC-001 | conflito entre artefatos (criterio, prazo, gate) | alto | consolidacao cruzada obrigatoria na Etapa 11 com matriz de conflito e decisao registrada | divergencia entre saidas 4/5/6/7 |
| R-ORC-002 | escopo inflado fora do aprovado (D-AR/ownership/threshold) | alto | enforce de guardrails em cada etapa + bloqueio imediato de aceite | proposta altera escopo aprovado sem aprovacao formal |
| R-ORC-003 | ausencia de evidencia verificavel por etapa | alto | checklist de saida por agente e recusa de aceite sem evidencia minima | etapa marcada concluida sem artefato objetivo |
| R-ORC-004 | indefinicao do alvo de deploy remoto e segredos operacionais | alto | gate de decisao obrigatoria entre Etapas 3 e 4 com owner e prazo | roadmap avanca para RC sem ambiente alvo aprovado |
| R-ORC-005 | desvio de prioridade por pressao de prazo (pular QA/RTM) | alto | impedir promocao RC/GA sem criterios de go/no-go e RTM P0 completos | tentativa de liberar release com pendencia F3-5/F3-10 |
| R-ORC-006 | dependencia opcional de UX ignorada sem avaliacao de risco | medio | exigir auditoria UX ou waiver formal assinado por PM/QA | falta de entrega da Etapa 10 sem justificativa |
| R-ORC-007 | desalinhamento entre roadmap final e backlog executavel | medio | revisao de consistencia entre Etapas 7/8/9 antes da consolidacao final | historias sem milestone/gate associado |
| R-ORC-008 | atraso em cadeia por bloqueio de uma unica etapa | medio | contingencia por marcos condicionais + trilha minima para manter fluxo | etapa bloqueada por mais de 1 ciclo sem plano alternativo |

## 8. Criterio de conclusao do ciclo completo
1. todas as etapas obrigatorias (1-9 e 11) concluidas com aceite; etapa 10 concluida ou waived formalmente com risco residual aceito.
2. todos os artefatos `Docs/Roadmap/*.md` da trilha estao preenchidos sem placeholders e com rastreabilidade de entrada/saida.
3. nenhum conflito aberto entre arquitetura, operacao, dados, QA, roadmap e backlog no momento da consolidacao final.
4. gates obrigatorios preservados: D-AR-001..D-AR-007 congeladas, PC-P1-01 deferido com trigger formal, `required-check` ativo.
5. `Docs/Roadmap/MASTER_PRODUCTION_ROADMAP_v1.md` consolidado com timeline beta->rc->ga, riscos residuais e plano de mitigacao.
6. handoff final emitido em `Docs/Handoffs/` e `Docs/Handoffs/LATEST.md` atualizado apenas apos aprovacao do roadmap mestre.
