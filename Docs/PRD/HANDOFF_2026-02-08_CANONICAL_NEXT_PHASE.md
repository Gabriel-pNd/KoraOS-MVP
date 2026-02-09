# Handoff - Transição para Próxima Fase (Caminho Canônico)

## 1) Metadados
- Projeto: KoraOS MVP
- Fase atual: PRD encerrado; transição para execução canônica
- Data/Hora (UTC-3): 2026-02-08 20:09:18 -03:00
- Autor(a): Codex + Gabriel
- Repositório/Branch: Gabriel-pNd/KoraOS-MVP / main
- Status geral: on-track

## 2) Resumo Executivo
- Objetivo desta etapa: fechar PRD, organizar documentação e preparar governança de entrega.
- Concluído:
  - Repositório isolado criado e publicado: https://github.com/Gabriel-pNd/KoraOS-MVP
  - Branch protection na main aplicada.
  - CI baseline criado (`required-check`) e exigido na proteção.
  - Templates de PR e Issue criados em `.github/`.
  - PR #1 de CI mergeado.
  - Documentos de PRD movidos para `docs/PRD` com versões degradadas em `docs/PRD/archive`.
- Pendente imediato: iniciar Fase canônica 1 (UX) com base no PRD final.

## 3) Contexto Essencial
- Problema principal: operacionalização de IA para clínicas com foco em redução de ineficiências de atendimento/operação.
- Premissas ativas:
  - Fluxo greenfield canônico.
  - PRD considerado finalizado para seguir.
  - Governança via PR obrigatório + CI obrigatório.
- Restrições:
  - Time enxuto/solo no momento.
  - Aprovação obrigatória de review ajustada para 0 (velocidade), mantendo gates técnicos.

## 4) Decisões Tomadas
| ID | Decisão | Motivo | Alternativas consideradas | Dono | Data |
|----|---------|--------|---------------------------|------|------|
| D-001 | Seguir caminho canônico do greenfield | Reduz retrabalho entre produto, UX e arquitetura | MVP rápido / risk-first puro | Gabriel | 2026-02-08 |
| D-002 | Exigir PR + CI na main | Preservar qualidade mínima com time pequeno | Push direto na main | Gabriel | 2026-02-08 |
| D-003 | Aprovação obrigatória = 0 | Viabilizar fluxo solo sem travar merge | 1 aprovação obrigatória | Gabriel | 2026-02-08 |

## 5) Mudanças Executadas
| ID | Tipo | Artefato | Descrição | Evidência |
|----|------|----------|-----------|-----------|
| C-001 | process | GitHub repo | Repo criado e publicado | https://github.com/Gabriel-pNd/KoraOS-MVP |
| C-002 | config | Branch protection | main protegida com `required-check` | proteção ativa na branch main |
| C-003 | code/config | `.github/workflows/ci.yml` | Workflow CI baseline com check obrigatório | commit `031be04` |
| C-004 | doc | `.github/PULL_REQUEST_TEMPLATE.md` + issue templates | Templates de colaboração | commit `7ea67b8` |
| C-005 | doc | `docs/PRD/*` | PRD e revisão organizados em pasta dedicada | estrutura de pastas atual |

## 6) Riscos e Mitigações
| ID | Risco | Severidade | Probabilidade | Mitigação | Trigger de ação |
|----|-------|------------|---------------|-----------|-----------------|
| R-001 | Merge sem revisão humana (approvals=0) | médio | média | reforçar CI e checklist de PR | aumento de regressões ou falhas de produção |
| R-002 | Inconsistência de nomenclatura de paths (`Docs` vs `docs` no git status) | médio | média | normalizar paths em um PR de housekeeping | diffs com deletes/adds inesperados |
| R-003 | CI ainda básico (sem testes funcionais) | alto | média | expandir pipeline com lint/test/security gradualmente | bug de regressão não capturado |

## 7) Próximos Passos (Caminho Canônico)
| Ordem | Ação | Dono | Critério de pronto | Prazo |
|------:|------|------|--------------------|-------|
| 1 | UX: detalhar fluxos, estados e wireframes dos épicos P0 | UX/Produto | fluxos aprovados por épico | próxima sessão |
| 2 | Architect: validar arquitetura-alvo, dependências e NFRs | Arquitetura | ADRs e riscos técnicos mapeados | próxima sessão |
| 3 | PM: consolidar ajustes no PRD após UX+Arquitetura | Produto | backlog estabilizado | próxima sessão |
| 4 | PO: sharding do PRD em épicos/stories executáveis | PO | stories com DoR | após consolidação |
| 5 | SM+Dev+QA: ciclo de implementação por story | Engenharia | PR com CI verde por story | contínuo |

## 8) Qualidade e Validação
- CI obrigatório ativo: `required-check`
- Branch protection ativa: PR obrigatório, histórico linear, sem force-push, sem delete
- PR de CI concluído e mergeado: #1

## 9) Instruções para Próximo Agente/LLM
- Leia primeiro:
  - `docs/PRD/12_prd_koraos_mvp_v1.0.md`
  - `docs/PRD/13_prd_review_blindspots_v1.3.md`
  - este handoff
- Não alterar sem alinhamento:
  - branch protection da main
  - regra de CI obrigatória
- Ordem recomendada de execução:
  1) [ux-design-expert.md](.agent/workflows/ux-design-expert.md) - Uma
  2) [architect.md](.agent/workflows/architect.md) - aria
  3) [pm.md](.agent/workflows/pm.md) - Morgan (consolidação)
  4) [po.md](.agent/workflows/po.md) - Pax (sharding)

## 10) Referências
- PRD final: `docs/PRD/12_prd_koraos_mvp_v1.0.md`
- Revisão PRD final: `docs/PRD/13_prd_review_blindspots_v1.3.md`
- Revisões antigas: `docs/PRD/archive/`
- Template handoff: `docs/templates/HANDOFF_TEMPLATE.md`

## 11) Atualização Pós-Handoff (2026-02-09)
- Decisão formal aplicada para mitigação mínima de alerta crítico sem ACK (item 10 da consolidação de riscos).
- Política aprovada:
  - Reenvio automático de alerta a cada 5 min por 30 min via WhatsApp.
  - ACK obrigatório pelo superadmin.
  - Fail-safe obrigatório após 15 min sem ACK.
- Comportamento do fail-safe:
  - entrar em modo seguro,
  - bloquear side-effects (`agendar`, `reagendar`, `cancelar`),
  - manter ingestão e enfileirar pendências,
  - enviar mensagem padrão de contingência,
  - abrir ticket crítico para próximo turno.
- Observação: mitigação definida sem exigência de equipe clínica 24/7.
