---
doc_id: KORA-PRD-REVIEW-001
base_prd: Docs/Brainstorming/12_prd_koraos_mvp_v1.0.md
review_type: blind_spots_multiphase
phases:
  - analyst
  - architect
  - qa
review_date: 2026-02-08
status: approved_with_critical_actions
---

# KoraOS MVP - Revisão Completa de Pontos Cegos (v1.0)

## 1. Objetivo

Consolidar de forma rastreável, amigável para humanos e LLMs, a revisão completa do PRD em 3 fases (Analyst, Architect, QA), incluindo:
- pontos cegos identificados,
- classificação de risco,
- opções de solução,
- decisões aprovadas,
- alterações aplicadas no PRD.

## 2. Escopo da Revisão

- Documento base analisado: `Docs/Brainstorming/12_prd_koraos_mvp_v1.0.md`
- Fontes de referência usadas na análise:
  - `Docs/Brainstorming/08_project_brief_v3.1_MASTER.md`
  - `Docs/Brainstorming/11_blind_spots_v3_consolidated.md`
  - `Docs/Brainstorming/08a_database_schema_complete.sql`
  - `Docs/Brainstorming/08b_n8n_workflows_complete.md`
  - `Docs/Brainstorming/08c_livia_agent_blindspots.md`
  - `Docs/Brainstorming/08d_nestjs_implementation.md`

## 3. Metodologia

### 3.1 Fase Analyst
Foco em lacunas de negócio, premissas escondidas, risco operacional e incoerência problema-solução.

### 3.2 Fase Architect
Foco em blind spots técnicos: dependências, confiabilidade, segurança, integridade de dados e falhas arquiteturais.

### 3.3 Fase QA
Foco em risco de entrega: testabilidade, critérios de aceite, cobertura de cenários críticos, regressão e quality gates.

## 4. Catálogo Consolidado de Pontos Cegos (30)

## 4.1 Analyst (F1)
| ID | Título curto | Risco | Status |
|---|---|---|---|
| F1-1 | SLA humano indefinido no nível contratual/produto | Crítico | Resolvido (decisão aplicada) |
| F1-2 | Governança jurídica incompleta para menores/guardians | Crítico | Resolvido (decisão aplicada) |
| F1-3 | KPI sem dicionário operacional completo | Alto | Pendente |
| F1-4 | Amostra de PMF pequena para inferência robusta | Alto | Pendente |
| F1-5 | Unit economics ausente no gate de negócio | Alto | Pendente |
| F1-6 | Dor de glosas fora do MVP sem ponte de valor | Alto | Pendente |
| F1-7 | Falta KPI de valor percebido da família | Alto | Pendente |
| F1-8 | Plano de adoção operacional ainda curto | Médio | Pendente |
| F1-9 | Dependência concentrada em WhatsApp | Alto | Pendente |
| F1-10 | Critério de continuidade pós-beta incompleto | Médio | Pendente |

## 4.2 Architect (F2)
| ID | Título curto | Risco | Status |
|---|---|---|---|
| F2-1 | Semântica de processamento sem garantia completa de ordem+idempotência | Crítico | Resolvido (decisão aplicada) |
| F2-2 | Risco de bypass de isolamento via service-role | Crítico | Resolvido (decisão aplicada) |
| F2-3 | Ausência de DR formal (RTO/RPO + restore test) | Crítico | Resolvido (decisão aplicada) |
| F2-4 | Gestão de segredos/chaves insuficientemente especificada | Crítico | Resolvido (decisão aplicada) |
| F2-5 | Redis não explicitado como dependência HA | Alto | Pendente |
| F2-6 | HA/scaling de N8N não explicitado | Alto | Pendente |
| F2-7 | SLOs incompletos para fluxos pesados | Alto | Pendente |
| F2-8 | Prompt rollout sem canary explícito | Alto | Pendente |
| F2-9 | Fairness entre tenants parcial | Médio | Pendente |
| F2-10 | Política de migração backward/forward incompleta | Médio | Pendente |

## 4.3 QA (F3)
| ID | Título curto | Risco | Status |
|---|---|---|---|
| F3-1 | UAT insuficiente para escopo total | Crítico | Resolvido (decisão aplicada) |
| F3-2 | Segurança sem plano de testes completo por fluxo | Crítico | Resolvido (decisão aplicada) |
| F3-3 | Critérios de aceite qualitativos em excesso | Alto | Pendente |
| F3-4 | Carga sem meta numérica de aprovação | Alto | Pendente |
| F3-5 | Falta RTM requisito->teste->evidência | Alto | Pendente |
| F3-6 | Estratégia de dados de teste incompleta | Alto | Pendente |
| F3-7 | Cobertura de casos negativos/borda não padronizada | Alto | Pendente |
| F3-8 | Resiliência externa sem fault injection formal | Alto | Pendente |
| F3-9 | Critérios de acessibilidade/dispositivos incompletos | Médio | Pendente |
| F3-10 | Gate de release sem scorecard completo | Médio | Pendente |

## 5. Decisões Aprovadas para Mitigar Críticos (Round 1)

Decisões confirmadas pelo Product Owner nesta rodada:
- F1-1 -> A+B+C
- F1-2 -> A+B
- F2-1 -> A+B
- F2-2 -> A+B
- F2-3 -> A+B
- F2-4 -> A+B+C
- F3-1 -> A+C
- F3-2 -> A+B+C

### 5.1 Registro de decisão (machine-friendly)

| ID | Decisão aprovada | Resultado esperado |
|---|---|---|
| F1-1 | A+B+C | SLA humano definido por contrato e tenant + política after-hours operacional |
| F1-2 | A+B | Matriz legal de guardiões + deny-by-default para ações sensíveis |
| F2-1 | A+B | Ordem por contato + dedupe por sequência/versionamento de conversa |
| F2-2 | A+B | Isolamento de service-role endurecido + testes automatizados de bypass |
| F2-3 | A+B | DR formal com RPO/RTO + restore test recorrente |
| F2-4 | A+B+C | Secret manager + segmentação de chaves + rotação emergencial |
| F3-1 | A+C | UAT ampliado por épico + gate por cobertura crítica obrigatória |
| F3-2 | A+B+C | Plano de segurança com OWASP + authz tests + pentest pré-beta |

## 6. Alterações Aplicadas no PRD

O documento base foi atualizado para refletir as decisões críticas aprovadas:
- `Docs/Brainstorming/12_prd_koraos_mvp_v1.0.md` -> versão evoluída para **v1.1** com adendo de revisão crítica.

Alterações principais incorporadas no adendo:
1. Política de SLA humano por contrato + parametrização por tenant + after-hours.
2. Governança legal de responsáveis e bloqueio por padrão para ações sensíveis.
3. Requisito técnico de ordem por contato e dedupe por sequência/versionamento.
4. Segurança de service-role + testes de bypass obrigatórios.
5. DR com RPO/RTO e restore test periódico.
6. Gestão de segredos com rotação e procedimento emergencial.
7. UAT expandido com cobertura mínima para fluxos críticos.
8. Segurança QA com OWASP, authz tests e pentest pré-beta.

## 7. Decisões em Aberto (Próxima Rodada)

Itens ainda pendentes para próxima revisão/decisão:
- F1-3 a F1-10 (exceto críticos já resolvidos)
- F2-5 a F2-10
- F3-3 a F3-10

## 8. Ordem Recomendada para Round 2

1. F2-5, F2-6, F2-7 (resiliência e SLO)
2. F3-3, F3-4, F3-5 (qualidade de critérios e evidência)
3. F1-3, F1-5, F1-7 (governança de produto e valor)

## 9. Changelog deste Artefato

- 2026-02-08: criação inicial da revisão consolidada (v1.0).
- 2026-02-08: registro das decisões críticas Round 1.

---

**Status atual**: críticos priorizados desta rodada documentados e encaminhados para execução no PRD.
