# O1 Execution Plan - Cycle 01

## 1. Metadados
- Projeto: KoraOS MVP
- Fase: 05-Implementation
- Onda: O1
- Ciclo: 01
- Data: 2026-02-10
- Status: in_progress

## 2. Premissas e guardrails ativos
1. O1/O2/O3 aprovadas em `ready_for_implementation`.
2. D-AR-001..D-AR-007 congeladas.
3. PC-P1-01 (N8N HA) permanece deferido com trigger formal.
4. `required-check` permanece gate obrigatorio de merge.
5. Nao alterar ownership/threshold sem trilha de aprovacao.

## 3. Ordem canonica de execucao da O1
| Ordem | Story ID | Dependencia | Trilha | Status no ciclo 01 |
|---|---|---|---|---|
| 1 | S-PC-01-001 | nenhuma | concorrencia/ordem | implementada |
| 2 | S-PC-01-002 | S-PC-01-001 | concorrencia/ordem | implementada |
| 3 | S-PC-01-003 | S-PC-01-002 | idempotencia/version guard | implementada |
| 4 | S-PC-02-001 | S-PC-01-003 | replay/TTL | backlog ciclo 02 |
| 5 | S-PC-02-002 | S-PC-02-001 | replay/version-as_of | backlog ciclo 02 |
| 6 | S-PC-02-003 | S-PC-02-002 | replay/status terminal | backlog ciclo 02 |
| 7 | S-PC-03-001 | nenhuma | alerta critico/no ACK | backlog ciclo 02 |
| 8 | S-PC-03-002 | S-PC-03-001 | safe mode entry | backlog ciclo 02 |

## 4. Foco de implementacao do ciclo 01
1. Entregar trilha PC-01 completa (`S-PC-01-001..003`).
2. Produzir evidencia automatizada por CAs obrigatorios de cada story.
3. Registrar runbook e riscos iniciais antes da abertura do ciclo 02.

## 5. Estrategia de evidencias por story
1. Evidencia funcional: testes automatizados por cenario obrigatorio.
2. Evidencia de observabilidade: validacao de logs estruturados em cada modulo.
3. Evidencia de degradacao/fallback: cenarios com indisponibilidade do backend primario.
4. Evidencia de rastreabilidade: arquivo dedicado por story em `Docs/Phases/05-Implementation/Evidence/O1/`.

## 6. Riscos iniciais do ciclo 01
| ID | Risco | Severidade | Mitigacao do ciclo 01 |
|---|---|---|---|
| R-O1-001 | Ausencia de adaptador de runtime (NestJS/Supabase) no repositorio atual | alto | isolar logica de dominio e testes para PR incremental sem violar stories |
| R-O1-002 | Sem pipeline de teste no CI, risco de regressao invisivel | medio | manter evidencia local e propor extensao de CI no ciclo 02 |
| R-O1-003 | Implementacao futura de replay/safe mode pode exigir integracao adicional | medio | manter contratos PC-02 e PC-03 intactos e acoplar no proximo ciclo |
