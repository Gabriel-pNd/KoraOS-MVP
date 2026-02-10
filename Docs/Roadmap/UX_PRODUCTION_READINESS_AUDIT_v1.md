# UX Production Readiness Audit v1

## 1. Metadata
- Projeto: KoraOS MVP
- Data: 2026-02-10
- Dono: ux-design-expert
- Status: ready-for-aios-master
- Execucao: executada por solicitacao explicita (auditoria heuristica documental pre-GA)

## 2. Objetivo
- validar se a UX operacional esta pronta para uso real em clinica e venda.
- identificar gaps criticos de experiencia antes do gate comercial GA.
- reduzir risco de adocao e erro operacional em fluxos P0/P1.

## 3. Fluxos criticos auditados
| Fluxo | Perfil | Estado atual | Risco UX | Severidade | Acao recomendada |
|---|---|---|---|---|---|
| Conversas + takeover | Secretaria | logica de takeover/safe mode validada em evidencia tecnica; UX de estado "IA silenciada", deadline e ownership ainda sem evidencia de tela consolidada | secretaria pode perder contexto de quem responde, quando expira SLA e como retomar fluxo seguro | alta | cockpit de takeover com status visual persistente, contador de SLA, CTA unicos (`assumir`, `encerrar takeover`, `escalar`) e timeline por `correlation_id` |
| Pipeline | Secretaria/Gestor | maquina de estados e audit log definidos; falta evidencia de UX para mover cards com seguranca em casos de excecao | movimento incorreto de card e perda de contexto podem gerar retrabalho e lead aging | medio-alta | padronizar interacao Kanban com bloqueio por senha/motivo, feedback imediato e undo controlado |
| Agenda | Secretaria/Gestor | regras de confirmacao e anti-conflito estao no backend; nao ha evidencia UX de resolucao clara de conflito em telas operacionais | erro de uso em reagendamento/cancelamento pode gerar no-show ou side-effect indevido | alta | fluxo guiado de conflito (opcao recomendada, impacto no paciente, confirmacao explicita final) + mensagens de erro acionaveis |
| Incidentes | Gestor/Superadmin | matriz de alertas e runbooks definidos; painel UX de incidentes e priorizacao por tenant nao evidenciado | aumento de MTTR por baixa legibilidade de prioridade e proxima acao | alta | command-center operacional com severidade, tenant impactado, playbook sugerido e estado do incidente em tempo real |
| Configuracoes | Gestor/Superadmin | parametros por tenant previstos; onboarding guiado e validacoes de configuracao critica sem evidencias de UX | configuracao incorreta de regras/SLA gera falha operacional silenciosa | medio-alta | wizard de onboarding por papel com checklist obrigatoria, validacao pre-save e resumo de risco por alteracao |

## 4. Acessibilidade e responsividade
| Categoria | Criterio minimo | Estado | Gap | Prioridade |
|---|---|---|---|---|
| A11y base (teclado/contraste/labels) | conformidade WCAG AA em telas P0/P1: foco visivel, ordem de tab, labels/aria, contraste >= 4.5:1 | parcial (requisito existe, evidencia UX dedicada nao encontrada) | falta auditoria formal por tela com checklist e correcao rastreavel | P0 pre-RC |
| Responsividade web | suporte 360/768/1024/1366 sem scroll horizontal em fluxos criticos | parcial | matriz de viewport nao evidenciada no gate atual | P0 pre-RC |
| Dispositivos low-end | operacao estavel em hardware de entrada com tempo de resposta aceitavel e feedback visual claro | nao evidenciado | ausencia de budget de performance UX por fluxo critico | P1 pre-RC |
| Rede degradada | estados claros de loading/retry/fallback humano em perda de conectividade | parcial (fallback tecnico existe) | estados de UI para rede ruim/offline nao estao consolidados com criterio de aceite | P0 pre-RC |

## 5. Risco de adocao
| Tema | Sinal de risco | Impacto | Mitigacao | Owner |
|---|---|---|---|---|
| Curva de aprendizado | onboarding por papel ainda em backlog (RB-M08-002), sem trilha UX operacional fechada | tempo alto para secretaria atingir autonomia, reduzindo adocao no piloto | onboarding guiado in-product + checklist por papel + videos curtos por tarefa critica | pm + operations + ux |
| Friccao operacional | tarefas criticas sem padrao unico de feedback/confirmacao podem exigir muitos passos | queda de throughput e aumento de erro humano em horario de pico | simplificar fluxos em 3 passos maximos para tarefas P0 e priorizar CTA primaria por tela | po + ux + frontend |
| Erro de uso em fluxo critico | ambiguidade de estado (safe mode/takeover/agenda) sem sinalizacao forte em UI | risco de side-effect indevido e impacto direto em paciente/agenda | estados bloqueantes explicitos, confirmacao de alto impacto e mensagens de contingencia acionaveis | qa + ux + backend |
| Confianca no produto | falta de visibilidade clara de "o que aconteceu" apos acao critica | suporte reativo e resistencia do gestor em escalar uso comercial | timeline auditavel por fluxo + feedback de sucesso/falha com proxima acao recomendada | operations + ux + sre |

## 6. Backlog de correcoes UX pre-GA
| ID | Correcao | Impacto | Esforco | Prioridade | Gate alvo |
|---|---|---|---|---|---|
| UX-001 | cockpit de takeover com contador SLA, owner visivel e acoes padronizadas | alto | M | P0 | Beta |
| UX-002 | banner global de safe mode com bloqueio visual de side-effects e rota de contingencia | alto | P | P0 | Beta |
| UX-003 | fluxo de conflito de agenda com resumo de impacto e confirmacao final explicita | alto | M | P0 | RC |
| UX-004 | padrao Kanban com validacao de movimento manual, motivo obrigatorio e undo controlado | medio-alto | M | P1 | RC |
| UX-005 | hardening de acessibilidade em telas P0/P1 (foco, labels, contraste, teclado) | alto | M | P0 | RC |
| UX-006 | matriz de responsividade 360/768/1024/1366 com testes de aceite por fluxo | alto | M | P0 | RC |
| UX-007 | estados de rede degradada (loading, retry, fallback humano, fila local) | alto | M | P0 | RC |
| UX-008 | budget UX/performance para dispositivos low-end + otimizacao de rendering | medio-alto | M | P1 | RC |
| UX-009 | onboarding guiado por papel (secretaria/gestor/superadmin) com checklist in-app | alto | M | P0 | GA |
| UX-010 | padronizacao de microcopy operacional (alerta, erro, confirmacao, contingencia) | medio-alto | S | P1 | GA |
| UX-011 | scorecard UX de adocao (task success, tempo por tarefa, CSAT/NPS) para gate comercial | alto | S | P0 | GA |

## 7. Criterio de aceite UX para go-live comercial
1. 100% dos fluxos criticos (`Conversas+takeover`, `Pipeline`, `Agenda`, `Incidentes`, `Configuracoes`) possuem mapa de estados normal/erro/degradado validado.
2. Nenhum gap UX `P0` aberto nas correcoes `UX-001`, `UX-002`, `UX-003`, `UX-005`, `UX-006`, `UX-007`, `UX-009`, `UX-011`.
3. Acessibilidade minima WCAG AA aprovada para telas P0/P1, com evidencias por tela e checklist assinada.
4. Responsividade validada em 360/768/1024/1366 sem quebra de fluxo critico e sem scroll horizontal indevido.
5. Cenarios de rede degradada e fallback humano executados com sucesso em UAT operacional.
6. Teste de usabilidade com usuarios de clinica (secretaria/gestor): task success >= 90% em tarefas criticas.
7. Tempo medio de execucao das tarefas criticas dentro do alvo definido pelo time operacional (sem regressao em relacao ao beta estabilizado).
8. Sem ambiguidades de estado em safe mode/takeover (usuario sempre sabe: estado atual, impacto e proxima acao).
9. Scorecard UX anexado ao gate GA com indicadores de adocao (`task_success`, `tempo_por_tarefa`, `CSAT/NPS`) e riscos residuais aceitos.
10. Aprovacao formal PM + PO + QA + Operations para go-live comercial com evidencias rastreaveis.

## 8. Referencias
- `Docs/Roadmap/FINAL_ROADMAP_TO_PRODUCTION_v1.md`
- `Docs/Roadmap/EXECUTION_BACKLOG_FROM_ROADMAP_v1.md`
- `Docs/Roadmap/ROADMAP_ORCHESTRATION_PLAN_v1.md`
- `Docs/Roadmap/QA_GO_NO_GO_FRAMEWORK_v1.md`
- `Docs/Roadmap/IMPLEMENTATION_EXECUTION_PLAYBOOK_v1.md`
- `Docs/Roadmap/DEVOPS_RELEASE_OPERATIONS_PLAN_v1.md`
- `Docs/PRD/12_prd_koraos_mvp_v1.0.md`
- `Docs/PRD/13_prd_review_blindspots_v1.3.md`
- `Docs/Phases/05-Implementation/O1_CYCLE-03_STATUS_v1.md`
- `Docs/Phases/05-Implementation/O2_CYCLE-01_STATUS_v1.md`
- `Docs/Phases/05-Implementation/O3_CYCLE-01_STATUS_v1.md`
