# Agent Prompts Fill Pack v1

Como usar:
1. ative o agente desejado via workflow em `.agent/workflows/<agente>.md`.
2. cole o prompt correspondente abaixo.
3. confirme que o agente preencheu o arquivo de saida indicado.
4. registre status em `Docs/Roadmap/ROADMAP_EXECUTION_STATUS_v1.md`.

Contexto base obrigatorio para todos os prompts:
- `Docs/Handoffs/LATEST.md`
- `Docs/Handoffs/HANDOFF_2026-02-10_PHASE-05-POST-MERGE-INCREMENTAL_v1.md`
- `Docs/Phases/README.md`
- `Docs/PRD/12_prd_koraos_mvp_v1.0.md`
- `Docs/PRD/13_prd_review_blindspots_v1.3.md`

Guardrails obrigatorios para todos os prompts:
1. nao reabrir D-AR-001..D-AR-007 sem impacto concreto.
2. manter PC-P1-01 (N8N HA) deferido com trigger formal.
3. manter `required-check` como gate obrigatorio.
4. se houver conflito documental, priorizar handoff mais recente + PRD final.

## 01) aios-master -> orchestration
Arquivo de saida:
- `Docs/Roadmap/ROADMAP_ORCHESTRATION_PLAN_v1.md`

Prompt:
```text
Preencha integralmente `Docs/Roadmap/ROADMAP_ORCHESTRATION_PLAN_v1.md`.

Objetivo:
- orquestrar a execucao multiagente para fechar roadmap final ate producao pronta para venda.

Entregue:
1. sequencia de agentes, entradas, saidas e criterio de aceite por etapa.
2. dependencias entre etapas e caminhos de contingencia.
3. criterio de conclusao do ciclo completo.
4. log inicial de riscos de coordenacao.

Nao crie outro arquivo para esta etapa.
```

## 02) analyst -> gap assessment
Arquivo de saida:
- `Docs/Roadmap/ANALYST_GAP_ASSESSMENT_v1.md`

Prompt:
```text
Preencha integralmente `Docs/Roadmap/ANALYST_GAP_ASSESSMENT_v1.md`.

Objetivo:
- avaliar estado atual vs estado alvo "producao pronta para venda".

Entregue:
1. matriz de gaps (produto, arquitetura, operacao, qualidade, seguranca, comercial readiness).
2. top bloqueios reais priorizados por impacto/urgencia.
3. riscos residuais e dependencias externas.
4. recomendacoes de fechamento por milestone.

Nao crie outro arquivo para esta etapa.
```

## 03) architect -> target architecture
Arquivo de saida:
- `Docs/Roadmap/ARCH_TARGET_PRODUCTION_v1.md`

Prompt:
```text
Preencha integralmente `Docs/Roadmap/ARCH_TARGET_PRODUCTION_v1.md`.

Objetivo:
- definir arquitetura alvo de producao e gates tecnicos beta->rc->ga.

Entregue:
1. arquitetura alvo (runtime, integracoes, observabilidade, continuidade).
2. decisoes tecnicas obrigatorias para fechamento dos riscos criticos.
3. plano para item deferido PC-P1-01 com trigger formal.
4. mapa de transicao do estado atual para estado alvo.

Nao crie outro arquivo para esta etapa.
```

## 04) devops -> release and operations
Arquivo de saida:
- `Docs/Roadmap/DEVOPS_RELEASE_OPERATIONS_PLAN_v1.md`

Prompt:
```text
Preencha integralmente `Docs/Roadmap/DEVOPS_RELEASE_OPERATIONS_PLAN_v1.md`.

Objetivo:
- fechar trilha de release e operacao para ambiente comercial.

Entregue:
1. estrategia de ambientes (dev/staging/prod).
2. pipeline CI/CD com gates obrigatorios.
3. deploy/rollback e resposta a incidente.
4. observabilidade e readiness operacional.

Nao crie outro arquivo para esta etapa.
```

## 05) data-engineer -> data readiness
Arquivo de saida:
- `Docs/Roadmap/DATA_READINESS_PLAN_v1.md`

Prompt:
```text
Preencha integralmente `Docs/Roadmap/DATA_READINESS_PLAN_v1.md`.

Objetivo:
- fechar prontidao de dados para escala inicial com compliance.

Entregue:
1. isolamento multi-tenant/RLS e validacao.
2. estrategia de migracao (expand/contract) e rollback.
3. backup/restore/DR com criterios verificaveis.
4. capacidade e performance para beta comercial.

Nao crie outro arquivo para esta etapa.
```

## 06) qa -> go/no-go framework
Arquivo de saida:
- `Docs/Roadmap/QA_GO_NO_GO_FRAMEWORK_v1.md`

Prompt:
```text
Preencha integralmente `Docs/Roadmap/QA_GO_NO_GO_FRAMEWORK_v1.md`.

Objetivo:
- definir gates de qualidade para beta, rc e ga comercial.

Entregue:
1. matriz de testes obrigatorios por milestone.
2. criterios objetivos de go/no-go.
3. politica de severidade e SLA de correcao.
4. RTM requisito->teste->evidencia.

Nao crie outro arquivo para esta etapa.
```

## 07) pm -> final roadmap
Arquivo de saida:
- `Docs/Roadmap/FINAL_ROADMAP_TO_PRODUCTION_v1.md`

Prompt:
```text
Preencha integralmente `Docs/Roadmap/FINAL_ROADMAP_TO_PRODUCTION_v1.md`.

Objetivo:
- consolidar milestones de medio e longo prazo ate producao pronta para venda.

Entregue:
1. milestones com objetivo, gate de saida, donos e datas-alvo.
2. KPI por milestone e criterio de go/no-go.
3. riscos e mitigacoes por horizonte.
4. dependencias criticas de negocio e tecnologia.

Nao crie outro arquivo para esta etapa.
```

## 08) po -> execution backlog
Arquivo de saida:
- `Docs/Roadmap/EXECUTION_BACKLOG_FROM_ROADMAP_v1.md`

Prompt:
```text
Preencha integralmente `Docs/Roadmap/EXECUTION_BACKLOG_FROM_ROADMAP_v1.md`.

Objetivo:
- transformar roadmap em backlog executavel por release/onda.

Entregue:
1. epicos/stories por milestone.
2. ordem de execucao e dependencias.
3. DoR/DoD e evidencia minima obrigatoria.
4. criterio de pronto por release.

Nao alterar ownership/threshold sem trilha de aprovacao.
Nao crie outro arquivo para esta etapa.
```

## 09) sm -> implementation playbook
Arquivo de saida:
- `Docs/Roadmap/IMPLEMENTATION_EXECUTION_PLAYBOOK_v1.md`

Prompt:
```text
Preencha integralmente `Docs/Roadmap/IMPLEMENTATION_EXECUTION_PLAYBOOK_v1.md`.

Objetivo:
- operacionalizar backlog em ciclos de execucao e controle.

Entregue:
1. cadencia de ciclos e ritos.
2. padrao branch/pr/merge/checks.
3. rotina de evidencias, runbooks e status.
4. protocolo de risco/bloqueio/escalonamento.

Nao crie outro arquivo para esta etapa.
```

## 10) ux-design-expert -> production UX readiness (opcional)
Arquivo de saida:
- `Docs/Roadmap/UX_PRODUCTION_READINESS_AUDIT_v1.md`

Prompt:
```text
Preencha integralmente `Docs/Roadmap/UX_PRODUCTION_READINESS_AUDIT_v1.md`.

Objetivo:
- auditar prontidao de UX para operacao clinica real e venda.

Entregue:
1. gaps criticos de UX operacional.
2. acessibilidade, responsividade e risco de adocao.
3. backlog de correcoes de UX antes de GA.
4. criterio de aceite UX para go-live comercial.

Nao crie outro arquivo para esta etapa.
```

## 11) aios-master -> master consolidation + handoff final
Arquivo de saida:
- `Docs/Roadmap/MASTER_PRODUCTION_ROADMAP_v1.md`

Prompt:
```text
Preencha integralmente `Docs/Roadmap/MASTER_PRODUCTION_ROADMAP_v1.md`.

Objetivo:
- consolidar todos os artefatos em um plano mestre unico.

Entregue:
1. consolidacao final sem conflitos.
2. linha do tempo final com gates beta->rc->ga.
3. riscos residuais e plano de mitigacao.
4. checklist de fechamento para handoff final.

Depois de concluir este arquivo, gere tambem:
- `Docs/Handoffs/HANDOFF_2026-02-10_PHASE-05-TO-PRODUCTION-ROADMAP_v1.md`
e atualize:
- `Docs/Handoffs/LATEST.md`
somente quando o roadmap mestre estiver aprovado.
```

