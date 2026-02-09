# Story S-PC-01-002 - Causal Commit by Contact

## 1. Metadados
- Story ID: S-PC-01-002
- Titulo: Garantir commit sequencial por `contact_id` em concorrencia
- Fase: 04-PO-Sharding
- Fonte consolidada (PC-P0-*): PC-P0-01
- ADR relacionado: D-AR-001
- Prioridade/Onda: P0 / O1
- Owner: Backend Lead
- Data: 2026-02-09
- Status: ready_for_po_review

## 2. Objetivo da story
- Problema que a story resolve: concorrencia em intents do mesmo contato pode aplicar efeitos fora da sequencia real.
- Resultado operacional esperado: cada contato possui sequencia causal unica para commit, sem inversao.

## 3. Escopo
- In scope:
  - mecanismo de sequenciamento por `contact_id`.
  - validacao de monotonicidade para commit.
- Out of scope:
  - paralelismo entre contatos diferentes (fica permitido).
  - politicas de replay (stories PC-02).

## 4. Regras congeladas aplicaveis
- [x] D-AR-001 commit causal por `contact_id`
- [ ] D-AR-002 replay com TTL + version guard
- [ ] D-AR-003 safe mode por falta de ACK em 15 min
- [ ] D-AR-004 saida safe mode com ACK + recovery auditavel + janela de estabilizacao
- [x] D-AR-005 observabilidade por fluxo com `correlation_id`
- [x] D-AR-006 lock/idempotencia Redis + fallback DB
- [ ] Secao 7 consolidacao (TTL e parametros operacionais aprovados)

## 5. Contrato funcional da story
1. Evento de entrada: lote de intents concorrentes para o mesmo `contact_id`.
2. Regras de processamento:
   - atribuir `commit_sequence` incremental por contato.
   - permitir commit somente quando `commit_sequence` esperado estiver disponivel.
3. Side-effects permitidos:
   - side-effect de intent apenas quando commit causal liberado.
4. Resultados terminais:
   - `committed_causal`
   - `waiting_previous_commit`
   - `blocked_conflict`
5. Tratamento de erro:
   - timeout de espera vai para fila de revisao manual.

## 6. Criterios de aceite (base)
1. Fluxo principal executa conforme contrato definido.
2. Fluxo alternativo/erro retorna estado terminal conhecido.
3. Nenhum side-effect ocorre fora das regras de seguranca operacional.

## 7. Criterios de aceite delta (obrigatorios)
### 7.1 Concorrencia e commit causal
- [x] `dispatch_priority` nao altera `commit_order`.
- [x] Conflito de versao resulta em bloqueio seguro e auditavel.

### 7.2 Replay e fences
- [ ] TTL validado antes de qualquer side-effect.
- [ ] `as_of`/versao validada antes de replay.
- [ ] Estados terminais padronizados: `replayed`, `expired_manual`, `conflict_blocked`.

### 7.3 Safe mode
- [ ] Entrada em safe mode ocorre em 15 min sem ACK.
- [ ] Em safe mode: side-effects bloqueados, ingestao mantida, pendencias enfileiradas.
- [ ] Saida exige ACK + recovery action + 10 min de health checks verdes.

### 7.4 Observabilidade e alerta
- [x] Logs estruturados com `correlation_id`.
- [x] Sinal de alerta definido (trigger -> canal -> owner -> SLA ACK).
- [x] Evidencia para auditoria/triagem disponivel.

### 7.5 Degradacao e fallback
- [x] Falha de dependencia (ex.: Redis) possui fallback declarado.
- [x] Continuacao controlada sem side-effect invalido.

## 8. NFR e operacao
- SLO/SLA impactado: protege confiabilidade de agenda sem quebrar SLA comercial.
- Limites de capacidade relevantes: pico 18 msg/min por clinica com contatos concorrentes.
- Impacto em custo/latencia: latencia controlada por fila de espera causal.
- Modo de contingencia: fallback DB para lock quando Redis indisponivel.

## 9. Evidencias de teste obrigatorias
1. Cenario com tres intents concorrentes no mesmo contato mantendo ordem causal.
2. Cenario com conflito que gera `blocked_conflict`.
3. Cenario de falha Redis com fallback DB.
4. Evidencia de log com `contact_id`, `commit_sequence`, `state`.

## 10. Runbook e resposta a incidente
- Trigger tecnico: fila `waiting_previous_commit` acima de threshold.
- Acao imediata: validar lock store e liberar itens presos por ordem invalida.
- Owner on-call / superadmin: Backend on-call + Platform on-call.
- Escalonamento: incident P1 se backlog de commit passar 10 min.
- Criterio de retorno ao estado normal: dreno total da fila causal sem conflito ativo.

## 11. Dependencias
- Dependencias tecnicas: S-PC-01-001 concluida.
- Dependencias de produto/operacao: definicao de threshold inicial para backlog causal.
- Ordem de execucao: segunda story da trilha PC-01.

## 12. Riscos residuais
| Risco | Severidade | Mitigacao | Owner |
|---|---|---|---|
| Crescimento de fila por contato em bursts | alto | threshold + alerta + fila manual de excecao | Backend Lead |

## 13. Checklist DoR
- [x] Fonte PC/ADR referenciada.
- [x] Contrato funcional fechado.
- [x] CAs base + delta preenchidos.
- [x] Owner e dependencias definidos.
- [x] Evidencia de teste planejada.
- [x] Alerta operacional definido.

## 14. Checklist DoD
- [ ] Todos os CAs aprovados em evidencia.
- [ ] Logs/metricas/alertas validados.
- [ ] Runbook atualizado.
- [ ] Sem regressao em side-effects sensiveis.
- [ ] Aprovacao PO/QA registrada.

## 15. Approval Log
| Data | Aprovador | Resultado | Observacao |
|---|---|---|---|
|  |  |  |  |
