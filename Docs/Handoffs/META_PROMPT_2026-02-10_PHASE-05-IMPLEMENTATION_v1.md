Quero iniciar a Fase 05 (Implementation) do KoraOS MVP pelo fluxo canonico.

## Contexto obrigatorio
1. Leia primeiro estes arquivos (nesta ordem):
- `Docs/Handoffs/HANDOFF_2026-02-10_PHASE-04-PO-SHARDING_v1.md`
- `Docs/Phases/05-Implementation/README.md`
- `Docs/Phases/05-Implementation/IMPLEMENTATION_EXECUTION_PLAN_P0_v1.md`
- `Docs/Phases/05-Implementation/IMPLEMENTATION_KICKOFF_CHECKLIST_P0_v1.md`
- `Docs/Phases/04-PO-Sharding/STORY_SHARDING_PLAN_P0_v1.md`

2. Considere que:
- O1, O2 e O3 estao aprovadas e em `ready_for_implementation`.
- D-AR-001..D-AR-007 estao congeladas e nao devem ser reabertas sem impacto concreto.
- PC-P1-01 (N8N HA) continua deferido com trigger formal.
- CI obrigatorio (`required-check`) continua gate de merge.

## Objetivo desta sessao
Iniciar execucao da Fase 05 com foco em implementacao por story e evidencia de aceite.

Prioridade desta sessao:
1. Planejar e iniciar implementacao da O1.
2. Executar com seguranca operacional e rastreabilidade.
3. Registrar riscos/bloqueios de execucao ja no primeiro ciclo.

## Entregaveis esperados nesta sessao
1. Plano curto de execucao da O1 (ordem de stories e dependencias).
2. Primeiras stories implementadas ou prontas para PR.
3. Evidencias de aceite do que foi implementado.
4. Estado de CI/checks e status de merge.
5. Lista de bloqueios reais (se houver) com proposta objetiva.

## Regras de execucao
1. Nao implementar fora das stories aprovadas.
2. Nao alterar ownership/threshold sem trilha de aprovacao.
3. Nao pular evidencia de aceite por story.
4. Se houver conflito entre documentos, priorizar handoff mais recente + plano da Fase 05.

## Formato da resposta
1. Resumo executivo curto
2. Stories atacadas nesta sessao
3. Evidencias e qualidade (CI/checks/testes)
4. Riscos e bloqueios
5. Proximos passos objetivos
