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

## 10. Decisões Aprovadas para Mitigar Riscos Altos (Round 2)

### 10.1 Decisões confirmadas pelo Product Owner

- F1-3 -> A+B agora, C na semana final
- F1-4 -> A+B
- F1-5 -> A+C, usando B para calibrar preço real
- F1-6 -> Não implementar nesta rodada (pedido de detalhamento)
- F1-7 -> A+B+C
- F2-5 -> A+B
- F2-6 -> Não implementar nesta rodada (pedido de detalhamento)
- F2-7 -> A+C
- F2-8 -> A+B, com C automatizado
- F3-3 -> A+B
- F3-4 -> A+B, com C na semana final
- F3-5 -> A+B
- F3-6 -> Não implementar nesta rodada (pedido de detalhamento)
- F3-7 -> Não implementar nesta rodada (pedido de detalhamento)
- F3-8 -> A+B

### 10.2 Registro machine-friendly (Round 2)

| ID | Risco | Decisão | Status |
|---|---|---|---|
| F1-3 | Alto | A+B now, C final week | Aprovado |
| F1-4 | Alto | A+B | Aprovado |
| F1-5 | Alto | A+C (+B calibração) | Aprovado |
| F1-6 | Alto | Deferred (detalhar A/B/C) | Adiado com análise |
| F1-7 | Alto | A+B+C | Aprovado |
| F2-5 | Alto | A+B | Aprovado |
| F2-6 | Alto | Deferred (detalhar A/B/C) | Adiado com análise |
| F2-7 | Alto | A+C | Aprovado |
| F2-8 | Alto | A+B (+C automatizado) | Aprovado |
| F3-3 | Alto | A+B | Aprovado |
| F3-4 | Alto | A+B now, C final week | Aprovado |
| F3-5 | Alto | A+B | Aprovado |
| F3-6 | Alto | Deferred (detalhar A/B/C) | Adiado com análise |
| F3-7 | Alto | Deferred (detalhar A/B/C) | Adiado com análise |
| F3-8 | Alto | A+B | Aprovado |

## 11. Plano de Execução (Agora vs Semana Final)

## 11.1 Executar agora

1. F1-3 A+B: dicionário de KPI + owner/ritual por KPI.
2. F1-4 A+B: desenho de piloto em ondas e estratificação de clínicas.
3. F1-5 A+C: critérios de unit economics no go/no-go + hipótese de pricing por faixa.
4. F1-7 A+B+C: CSAT/NPS, churn familiar por motivo e indicador de confiança.
5. F2-5 A+B: declarar Redis HA e fallback no banco para modo degradado.
6. F2-7 A+C: SLO por jornada e orçamento de timeout por integração.
7. F2-8 A+B + C automatizado: canary de prompt + shadow eval + rollback automático por threshold.
8. F3-3 A+B: critérios mensuráveis + exemplos Given/When/Then para stories P0.
9. F3-4 A+B: metas de carga e budget de latência/erro.
10. F3-5 A+B: RTM (requisito->teste->evidência) + vínculo de evidência em CI para P0.
11. F3-8 A+B: fault injection em staging + testes de fallback com SLA de recuperação.

## 11.2 Semana final (explicitamente aprovada)

1. F1-3 C: congelar baseline por tenant e janela de medição final.
2. F3-4 C: rodar soak test (4-8h) no gate final pré-beta.

## 12. Itens Adiados com Explicação Detalhada (A/B/C)

## 12.1 F1-6 (Alto) - Dor de glosas fora do MVP sem ponte de valor

### Solução A - Glosa-lite no MVP
Como funciona:
1. Na etapa de operação, o sistema aplica checklist pré-envio com regras simples (campos obrigatórios, consistência de cadastro e flags de risco).
2. Itens com risco alto de glosa recebem alerta para revisão humana antes de fechamento.
3. O resultado aparece em painel operacional com taxa de "erro evitável".

Prós:
- Entrega ponte de valor imediata sem construir motor completo de auditoria.
- Reduz fricção com gestores que já sentem a dor hoje.

Contras:
- Cobertura limitada, não substitui auditoria full de operadora.

### Solução B - Compromisso de produto v1.1/v1.2 com datas e escopo mínimo
Como funciona:
1. PRD e roadmap oficializam marco de entrega de glosas com escopo mínimo e data.
2. Beta coleta dados necessários (rejeições, motivos, operadoras mais incidentes).
3. Roadmap pós-beta prioriza primeiro as regras de maior impacto financeiro.

Prós:
- Alinha expectativa comercial e reduz risco de promessa vaga.
- Mantém foco do MVP sem inflar escopo.

Contras:
- Não resolve dor no curto prazo operacional da clínica.

### Solução C - Piloto focado em 1 operadora
Como funciona:
1. Selecionar operadora dominante nos pilotos.
2. Implementar conjunto enxuto de regras de validação para essa operadora.
3. Medir redução de inconsistência e tempo de retrabalho.

Prós:
- Prova valor tangível com escopo controlado.
- Gera template para expansão em outras operadoras.

Contras:
- Generalização limitada; risco de dependência de um caso específico.

Recomendação técnica de próxima rodada:
- Iniciar com A+B juntos; C quando houver capacidade para teste real com operadora dominante.

## 12.2 F2-6 (Alto) - HA/scaling de N8N não explicitado

### Solução A - Workers redundantes com fila central
Como funciona:
1. N8N opera com múltiplos workers consumindo fila compartilhada.
2. Se um worker cair, outro continua consumo sem perda de backlog.
3. Métricas de fila e consumo por worker sustentam autoscaling.

Prós:
- Aumenta disponibilidade e throughput com padrão conhecido.
- Reduz single point of failure no orquestrador.

Contras:
- Exige operação mais madura (monitoramento e tuning de concorrência).

### Solução B - Tirar crons críticos do N8N para scheduler do backend
Como funciona:
1. Jobs críticos (follow-up, lembretes, deadlines) rodam em scheduler do backend (NestJS) com persistência transacional.
2. N8N fica focado em automações menos críticas e integração de fluxo.
3. Reprocessamento e idempotência ficam centralizados na camada de domínio.

Prós:
- Melhor controle transacional para rotinas de negócio críticas.
- Facilita testes determinísticos e observabilidade por domínio.

Contras:
- Aumenta complexidade no backend e reduz simplicidade do low-code.

### Solução C - Health checks + failover automatizado
Como funciona:
1. Probes ativas monitoram latência/erro do N8N.
2. Ao detectar degradação, aciona failover para nó reserva ou modo degradado de processamento.
3. Alertas para operação + trilha de incidente.

Prós:
- Reduz MTTR em falhas de infraestrutura.
- Mantém serviço com menor intervenção manual.

Contras:
- Requer maturidade de observabilidade e automação de infraestrutura.

Recomendação técnica de próxima rodada:
- A+C como base de HA; B para fluxos com exigência transacional mais rígida.

## 12.3 F3-6 (Alto) - Estratégia de dados de teste incompleta

### Solução A - Catálogo de fixtures por persona/tenant
Como funciona:
1. Definir massa de dados padrão para secretária, gestor e superadmin.
2. Fixtures cobrem cenários normais e críticos por tenant.
3. Cada suíte de teste referencia fixture versionada.

Prós:
- Reprodutibilidade alta.
- Facilita onboarding de QA e dev.

Contras:
- Pode ficar obsoleto sem manutenção contínua.

### Solução B - Gerador de dados sintéticos por cenário
Como funciona:
1. Ferramenta gera dados sintéticos conforme parâmetros (volume, distribuição, edge cases).
2. Permite simular picos e combinações difíceis de reproduzir manualmente.
3. Integra com testes de carga e resiliência.

Prós:
- Escalável para testes volumétricos e de borda.
- Reduz risco de usar dados sensíveis reais.

Contras:
- Maior custo de implementação inicial.

### Solução C - Reset determinístico de ambiente
Como funciona:
1. Pipeline de teste inicia com reset para estado conhecido.
2. Dados seedados via scripts versionados com checksum.
3. Falhas ficam reproduzíveis entre times e execuções.

Prós:
- Elimina inconsistência de ambiente entre execuções.
- Aumenta confiança em regressão automatizada.

Contras:
- Requer disciplina de infra/test harness.

Recomendação técnica de próxima rodada:
- A+C para baseline imediato; B para ampliar cobertura de carga e edge cases.

## 12.4 F3-7 (Alto) - Cobertura de casos negativos/borda não padronizada

### Solução A - Template obrigatório de AC (happy/edge/error)
Como funciona:
1. Toda story P0/P1 passa a exigir critérios para caminhos feliz, borda e erro.
2. PR/QA check valida presença mínima desses critérios.
3. Stories sem esse padrão não entram em desenvolvimento.

Prós:
- Padroniza qualidade desde o planejamento.
- Reduz ambiguidade de teste.

Contras:
- Aumenta rigor e esforço na escrita de histórias.

### Solução B - Checklist de borda por domínio
Como funciona:
1. Cada módulo (agenda, fila, conversa, takeover) tem checklist de bordas conhecidas.
2. QA e dev validam checklist no review de story e no gate.
3. Itens não cobertos viram débito técnico rastreado.

Prós:
- Captura conhecimento tácito e reduz esquecimento.
- Fácil de evoluir incrementalmente.

Contras:
- Pode virar burocrático se não for enxuto.

### Solução C - Métrica de defeito escapado por categoria
Como funciona:
1. Incidentes pós-release são classificados por categoria de lacuna (edge/error/race/security).
2. Métrica retroalimenta backlog e templates.
3. Triggers de melhoria ativam quando taxa ultrapassar limite.

Prós:
- Fecha ciclo de aprendizado de qualidade com dados reais.
- Direciona investimento para onde mais dói.

Contras:
- Valor aparece no médio prazo.

Recomendação técnica de próxima rodada:
- A+B para prevenção imediata; C para melhoria contínua orientada a dados.

## 13. Observação de Integridade do Escopo de Alto Risco

- O item **F1-9 (Dependência concentrada em WhatsApp, risco alto)** permaneceu sem decisão explícita nesta rodada.
- Status: **Pendente de decisão do PO**.
- Recomendação: incluir no próximo pacote de decisões para concluir 100% dos riscos altos da trilha Analyst.

## 14. Changelog (v1.1)

- 2026-02-08: criação de v1.1 com decisões Round 2 (riscos altos).
- 2026-02-08: detalhamento técnico-funcional dos itens adiados F1-6, F2-6, F3-6, F3-7.
- 2026-02-08: registro de execução "agora" vs "semana final".

---

**Status atual (v1.1)**: riscos críticos resolvidos + maioria dos riscos altos decidida; pendências explicitamente rastreadas.
