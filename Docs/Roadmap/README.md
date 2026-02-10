# Roadmap Workspace - Greenfield to Production

Objetivo:
- centralizar os artefatos de planejamento final para levar o KoraOS MVP de `Phase 05` ate producao pronta para venda.

Escopo:
1. consolidacao de analise (`as-is` vs `to-be`).
2. definicao de arquitetura/operacao/qualidade para release comercial.
3. roadmap final com milestones e backlog executavel.

Guardrails obrigatorios:
1. manter D-AR-001..D-AR-007 congeladas sem reabertura sem impacto concreto.
2. manter PC-P1-01 (N8N HA) deferido com trigger formal.
3. manter `required-check` como gate obrigatorio de merge.
4. se houver conflito, priorizar handoff mais recente + PRD final.

Arquivos desta pasta:
1. `Docs/Roadmap/AGENT_PROMPTS_FILL_PACK_v1.md`
2. `Docs/Roadmap/ROADMAP_ORCHESTRATION_PLAN_v1.md`
3. `Docs/Roadmap/ANALYST_GAP_ASSESSMENT_v1.md`
4. `Docs/Roadmap/ARCH_TARGET_PRODUCTION_v1.md`
5. `Docs/Roadmap/DEVOPS_RELEASE_OPERATIONS_PLAN_v1.md`
6. `Docs/Roadmap/DATA_READINESS_PLAN_v1.md`
7. `Docs/Roadmap/QA_GO_NO_GO_FRAMEWORK_v1.md`
8. `Docs/Roadmap/FINAL_ROADMAP_TO_PRODUCTION_v1.md`
9. `Docs/Roadmap/EXECUTION_BACKLOG_FROM_ROADMAP_v1.md`
10. `Docs/Roadmap/IMPLEMENTATION_EXECUTION_PLAYBOOK_v1.md`
11. `Docs/Roadmap/UX_PRODUCTION_READINESS_AUDIT_v1.md`
12. `Docs/Roadmap/MASTER_PRODUCTION_ROADMAP_v1.md`
13. `Docs/Roadmap/ROADMAP_EXECUTION_STATUS_v1.md`

Ordem canonica recomendada:
1. `aios-master` -> orchestration plan.
2. `analyst` -> gap assessment.
3. `architect` -> production target architecture.
4. `devops` -> release/operations plan.
5. `data-engineer` -> data readiness plan.
6. `qa` -> go/no-go framework.
7. `pm` -> final roadmap.
8. `po` -> execution backlog.
9. `sm` -> implementation playbook.
10. `ux-design-expert` -> UX readiness audit (se houver gap de UX).
11. `aios-master` -> master roadmap + handoff final.

