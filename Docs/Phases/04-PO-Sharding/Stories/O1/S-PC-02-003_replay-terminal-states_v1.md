# Story S-PC-02-003 - Replay Terminal States

## 1. Metadados
- Story ID: S-PC-02-003
- Titulo: Padronizar resultados terminais de replay
- Fase: 04-PO-Sharding
- Fonte consolidada (PC-P0-*): PC-P0-02
- ADR relacionado: D-AR-002
- Prioridade/Onda: P0 / O1
- Owner: Backend + Ops
- Data: 2026-02-09
- Status: ready_for_po_review

## 2. Objetivo da story
- Problema que a story resolve: resultados heterogeneos de replay dificultam operacao e auditoria.
- Resultado operacional esperado: replay adota apenas estados terminais padronizados e acionaveis.

## 3. Escopo
- In scope:
  - padrao unico de status para replay.
  - contrato operacional para fila manual.
- Out of scope:
  - desenho de dashboard completo (O2/O3).
  - automacao de saida de safe mode.

## 4. Regras congeladas aplicaveis
- [ ] D-AR-001 commit causal por `contact_id`
- [x] D-AR-002 replay com TTL + version guard
- [ ] D-AR-003 safe mode por falta de ACK em 15 min
- [ ] D-AR-004 saida safe mode com ACK + recovery auditavel + janela de estabilizacao
- [x] D-AR-005 observabilidade por fluxo com `correlation_id`
- [ ] D-AR-006 lock/idempotencia Redis + fallback DB
- [x] Secao 7 consolidacao (TTL e parametros operacionais aprovados)

## 5. Contrato funcional da story
1. Evento de entrada: replay apos validacoes de TTL e versao.
2. Regras de processamento:
   - aplicar side-effect quando elegivel.
   - registrar status terminal unico.
3. Side-effects permitidos:
   - side-effect unico em `replayed`.
   - criacao de tarefa manual em `expired_manual` e `conflict_blocked`.
4. Resultados terminais:
   - `replayed`
   - `expired_manual`
   - `conflict_blocked`
5. Tratamento de erro:
   - erro inesperado gera `manual_review_required` com contexto tecnico.

## 6. Criterios de aceite (base)
1. Fluxo principal executa conforme contrato definido.
2. Fluxo alternativo/erro retorna estado terminal conhecido.
3. Nenhum side-effect ocorre fora das regras de seguranca operacional.

## 7. Criterios de aceite delta (obrigatorios)
### 7.1 Concorrencia e commit causal
- [ ] `dispatch_priority` nao altera `commit_order`.
- [ ] Conflito de versao resulta em bloqueio seguro e auditavel.

### 7.2 Replay e fences
- [x] TTL validado antes de qualquer side-effect.
- [x] `as_of`/versao validada antes de replay.
- [x] Estados terminais padronizados: `replayed`, `expired_manual`, `conflict_blocked`.

### 7.3 Safe mode
- [ ] Entrada em safe mode ocorre em 15 min sem ACK.
- [ ] Em safe mode: side-effects bloqueados, ingestao mantida, pendencias enfileiradas.
- [ ] Saida exige ACK + recovery action + 10 min de health checks verdes.

### 7.4 Observabilidade e alerta
- [x] Logs estruturados com `correlation_id`.
- [x] Sinal de alerta definido (trigger -> canal -> owner -> SLA ACK).
- [x] Evidencia para auditoria/triagem disponivel.

### 7.5 Degradacao e fallback
- [ ] Falha de dependencia (ex.: Redis) possui fallback declarado.
- [ ] Continuacao controlada sem side-effect invalido.

## 8. NFR e operacao
- SLO/SLA impactado: reduz MTTR de incidentes de replay por classificacao clara.
- Limites de capacidade relevantes: fila manual nao pode ultrapassar limite operacional do turno.
- Impacto em custo/latencia: baixo, com ganho em operabilidade.
- Modo de contingencia: `manual_review_required` para erros nao classificados.

## 9. Evidencias de teste obrigatorias
1. Cenario de sucesso retorna `replayed`.
2. Cenario expirado retorna `expired_manual` e cria tarefa manual.
3. Cenario de conflito retorna `conflict_blocked` e cria tarefa manual.
4. Evidencia de relatorio por status e `correlation_id`.

## 10. Runbook e resposta a incidente
- Trigger tecnico: crescimento de `expired_manual` ou `conflict_blocked` fora do baseline.
- Acao imediata: priorizar fila manual por criticidade de intent.
- Owner on-call / superadmin: Ops lead + superadmin.
- Escalonamento: Product para ajuste de regra se houver padrao recorrente.
- Criterio de retorno ao estado normal: backlog manual dentro do limite do turno.

## 11. Dependencias
- Dependencias tecnicas: S-PC-02-001 e S-PC-02-002 concluidas.
- Dependencias de produto/operacao: contrato da fila manual aprovado.
- Ordem de execucao: fechamento da trilha PC-02 na O1.

## 12. Riscos residuais
| Risco | Severidade | Mitigacao | Owner |
|---|---|---|---|
| Acumulo de tarefas manuais em pico | alto | priorizacao por intent + alerta de backlog | Ops |

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
