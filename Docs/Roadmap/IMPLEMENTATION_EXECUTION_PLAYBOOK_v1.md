# Implementation Execution Playbook v1

## 1. Metadata
- Projeto: KoraOS MVP
- Data: 2026-02-10
- Dono: sm
- Status: ready-for-aios-master

## 2. Objetivo
- transformar backlog aprovado em execucao controlada por ciclos.
- padronizar ritos e controles para O-01..O-07 sem quebrar guardrails aprovados.
- garantir fluxo previsivel de entrega: story -> PR -> evidencia -> gate de ciclo -> gate de release.

## 3. Cadencia de execucao
| Ciclo | Janela | Escopo | Dono | Criterio de saida |
|---|---|---|---|---|
| C-01 (M06-S1) | 2026-02-11 a 2026-02-17 | fechar PR/merge de O-01 (S-PC-01..03, S-PC-02..03), iniciar O-02 | sm + engineering leads | O-01 mergeada com `required-check` verde, evidencia publicada, sem risco critico aberto |
| C-02 (M06-S2) | 2026-02-18 a 2026-02-24 | fechar O-02 e O-03, abrir RB-M06-001..003 apos aprovacao PO | sm + devops + po | O-02/O-03 concluidas, runbooks atualizados, RB-M06-001..003 prontos para execucao |
| C-03 (M06-S3) | 2026-02-25 a 2026-02-28 | executar RB-M06-004 e consolidar gate Beta (M06) | sm + devops + data-engineer + qa | restore drill PASS, status consolidado de M06 e backlog O-05 priorizado |

### 3.1 Ritos obrigatorios por ciclo
1. `Planning` (D0, 60 min): selecionar stories prontas (`ready_for_implementation`), confirmar dependencias e owners.
2. `Daily sync` (D1..Dn, 15 min): progresso por story, impedimentos, risco de SLA e gates.
3. `Risk triage` (3x semana, 30 min): revisar bloqueios, severidade, trigger e escalonamento.
4. `Evidence review` (D-1, 45 min): verificar pacote minimo de evidencia por story e por onda.
5. `Cycle review + retro` (ultimo dia, 60 min): fechar status de ciclo, registrar licoes, ajustar WIP do proximo ciclo.

### 3.2 Limites de WIP e politica de abertura
1. WIP maximo por ciclo: 5 stories em paralelo por onda.
2. nova story so abre quando houver capacidade real e dependencias desbloqueadas.
3. itens `pending_po_approval` (RB-*) nao entram em execucao sem aprovacao formal.

## 4. Fluxo operacional por story
1. validar entrada (`ready_for_implementation`, dependencias, owner).
2. implementar minimo contrato da story.
3. rodar testes/checks obrigatorios.
4. gerar evidencia funcional e operacional.
5. abrir PR com `required-check` verde.
6. executar revisao de risco residual (critico/alto/medio) antes de merge.
7. atualizar status de ciclo e runbook aplicavel no fechamento da story.

Estados operacionais permitidos:
1. `ready_for_implementation`
2. `in_progress`
3. `ready_for_pr`
4. `merged`
5. `blocked` (com owner + trigger + ETA)

## 5. Padrao branch/pr/merge/checks
| Tema | Padrao | Responsavel | Evidencia |
|---|---|---|---|
| Branch naming | `feature/{story-id}-{slug}` para story; `hotfix/{id}-{slug}` para incidente critico | dev (local) + sm (orquestracao) | branch list + referencia no PR |
| PR template/checklist | PR deve conter Story ID, DoR/DoD, riscos residuais, links de evidencia e impacto de runbook | dev + reviewer (qa/devops quando aplicavel) | checklist completo no PR |
| Required checks | `required-check` com lint, unit/integration, `npm run smoke:runtime`, security checks | CI + dev + qa | jobs CI verdes + links no PR |
| Merge policy | merge somente em `main` apos checks verdes e aprovacoes exigidas; proibido bypass manual | maintainer + devops | historico de merge + auditoria CI |
| Release tagging | RC/GA apenas via artefato imutavel (commit SHA/tag), sem deploy direto de branch | devops | log de deploy com SHA/tag e resultado |

Regras adicionais de merge:
1. PR com risco critico aberto = `NO_MERGE`.
2. PR sem evidencia minima obrigatoria = `NO_MERGE`.
3. mudanca em ownership/threshold = bloqueada sem trilha de aprovacao PO/PM.

## 6. Protocolo de risco e bloqueio
| Severidade | Acao imediata | Escalonamento | SLA de resposta |
|---|---|---|---|
| Critico | congelar merge da onda impactada; ativar safe mode/degradacao quando aplicavel; abrir incidente P0 | superadmin -> devops on-call -> architect -> pm/po | ACK <= 5 min; contencao <= 15 min; recuperacao <= 60 min |
| Alto | bloquear story/PR afetada; aplicar workaround operacional; priorizar correcao no ciclo atual | tech lead -> qa -> devops -> sm | ACK <= 15 min; contencao <= 60 min; correcao <= 72h |
| Medio | registrar risco, owner e prazo; manter execucao com monitoramento reforcado | owner da story -> sm -> po | ACK <= 4h uteis; correcao <= 14 dias |

### 6.1 Protocolo de bloqueio (`blocked`)
1. registrar bloqueio com `ID`, causa, impacto, owner, ETA e dependencia upstream.
2. classificar severidade e aplicar SLA correspondente.
3. escalar em ate 1 nivel por janela de SLA violada.
4. se bloqueio durar mais de 1 ciclo: revisar escopo, reduzir WIP e replanejar ordem da onda.

### 6.2 Triggers obrigatorios de escalonamento imediato
1. falha de restore fora de RPO/RTO.
2. finding Critico de seguranca aberto.
3. `required-check` falhando de forma recorrente (>= 3 falhas consecutivas sem resolucao).
4. trigger formal de `PC-P1-01` (`>= 2` incidentes P0 em 14 dias ou replay critico por 3 dias).

## 7. Evidencias e rastreabilidade
| Item | Obrigatorio | Onde registrar | Gate |
|---|---|---|---|
| Evidencia por story | sim | `Docs/Phases/05-Implementation/Evidence/*` ou proxima fase equivalente | pre-merge |
| Status de ciclo | sim | documento de status de ciclo | fim de ciclo |
| Runbook update | quando aplicavel | runbooks da fase | fim de onda |
| Evidence pack da onda | sim | `Docs/Phases/05-Implementation/Evidence/O*/` + consolidado de ciclo | gate de onda |
| Registro de incidente/postmortem | para P0/P1 | runbook/status do ciclo afetado | antes de reabrir merge |

### 7.1 Rotina operacional de registro
1. por story (`daily`): atualizar estado, link de branch/PR e evidencias parciais.
2. por ciclo (`end-of-cycle`): publicar status com concluido/pendente/bloqueado e riscos residuais.
3. por onda (`end-of-wave`): consolidar evidence pack e runbook updates.
4. por release (`beta/rc/ga`): anexar scorecard, RTM, relatorios de seguranca/performance/DR.

### 7.2 Checklist minimo de evidencia por story
1. evidencia funcional dos CAs (base + delta).
2. evidencia de logs/metricas/alertas aplicaveis.
3. evidencia de erro/degradacao/fallback quando aplicavel.
4. referencia de runbook alterado ou justificativa de "nao aplicavel".
5. link de PR com `required-check` verde.

## 8. Referencias
- `Docs/Roadmap/EXECUTION_BACKLOG_FROM_ROADMAP_v1.md`
- `Docs/Roadmap/QA_GO_NO_GO_FRAMEWORK_v1.md`
- `Docs/Roadmap/FINAL_ROADMAP_TO_PRODUCTION_v1.md`
- `Docs/Roadmap/DEVOPS_RELEASE_OPERATIONS_PLAN_v1.md`
- `Docs/Roadmap/ROADMAP_ORCHESTRATION_PLAN_v1.md`
- `Docs/Phases/05-Implementation/IMPLEMENTATION_EXECUTION_PLAN_P0_v1.md`
- `Docs/Phases/05-Implementation/O1_CYCLE-03_STATUS_v1.md`
- `Docs/Phases/05-Implementation/O2_CYCLE-01_STATUS_v1.md`
- `Docs/Phases/05-Implementation/O3_CYCLE-01_STATUS_v1.md`
- `Docs/Phases/05-Implementation/RUNTIME_DEPLOY_STATUS_CYCLE-01_v1.md`
