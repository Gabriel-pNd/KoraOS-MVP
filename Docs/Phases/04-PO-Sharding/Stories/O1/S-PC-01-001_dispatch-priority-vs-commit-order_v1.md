# Story S-PC-01-001 - Dispatch Priority vs Commit Order

## 1. Metadados
- Story ID: S-PC-01-001
- Titulo: Separar `dispatch_priority` de `commit_order` no fluxo de fila
- Fase: 04-PO-Sharding
- Fonte consolidada (PC-P0-*): PC-P0-01
- ADR relacionado: D-AR-001
- Prioridade/Onda: P0 / O1
- Owner: Backend Lead (apoio: QA)
- Data: 2026-02-09
- Status: ready_for_implementation

## 2. Objetivo da story
- Problema que a story resolve: prioridade de despacho pode reordenar commit e gerar side-effect stale.
- Resultado operacional esperado: fila despacha por prioridade, mas confirma side-effect apenas na ordem causal por contato.

## 3. Escopo
- In scope:
  - modelo de dados com `dispatch_priority` separado de `commit_order`.
  - regra de ordenacao causal por `contact_id`.
- Out of scope:
  - tuning de prioridade por tenant.
  - mudancas em UX.

## 4. Regras congeladas aplicaveis
- [x] D-AR-001 commit causal por `contact_id`
- [ ] D-AR-002 replay com TTL + version guard
- [ ] D-AR-003 safe mode por falta de ACK em 15 min
- [ ] D-AR-004 saida safe mode com ACK + recovery auditavel + janela de estabilizacao
- [x] D-AR-005 observabilidade por fluxo com `correlation_id`
- [ ] D-AR-006 lock/idempotencia Redis + fallback DB
- [ ] Secao 7 consolidacao (TTL e parametros operacionais aprovados)

## 5. Contrato funcional da story
1. Evento de entrada: mensagem recebida para processamento de intent.
2. Regras de processamento:
   - calcular `dispatch_priority` para escolher proximo item despachado.
   - validar `commit_order` monotono por `contact_id` antes de side-effect.
3. Side-effects permitidos:
   - atualizar estado de fila e metadados de ordenacao.
4. Resultados terminais:
   - `queued_for_dispatch`
   - `blocked_commit_order_violation`
5. Tratamento de erro:
   - item sem `contact_id` vai para `invalid_payload_manual`.

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
- [ ] Falha de dependencia (ex.: Redis) possui fallback declarado.
- [ ] Continuacao controlada sem side-effect invalido.

## 8. NFR e operacao
- SLO/SLA impactado: preserva SLA comercial <= 15 min ao evitar reprocesso por erro de ordem.
- Limites de capacidade relevantes: 1.000 msg/dia por clinica, pico 18 msg/min.
- Impacto em custo/latencia: baixo aumento de latencia por validacao causal.
- Modo de contingencia: bloquear commit invalido e escalar para fila manual.

## 9. Evidencias de teste obrigatorias
1. Cenario com duas mensagens de prioridades diferentes para mesmo contato.
2. Cenario de violacao de ordem com bloqueio seguro.
3. Cenario de alta concorrencia por contato.
4. Evidencia de log com `correlation_id`, `dispatch_priority`, `commit_order`.

## 10. Runbook e resposta a incidente
- Trigger tecnico: `blocked_commit_order_violation` >= 3 em 15 min por clinica (warning) ou >= 10 em 15 min por clinica (critico).
- Acao imediata: congelar side-effects do contato afetado e rerotear para revisao manual.
- Owner on-call / superadmin: Backend on-call + superadmin.
- Escalonamento: Platform em ate 15 min se padrao recorrente.
- Criterio de retorno ao estado normal: normalizacao da ordem causal e fila sem bloqueios.

## 11. Dependencias
- Dependencias tecnicas: definicao de schema de fila e campos de ordenacao.
- Dependencias de produto/operacao: nenhuma.
- Ordem de execucao: primeira story tecnica da O1.

## 12. Riscos residuais
| Risco | Severidade | Mitigacao | Owner |
|---|---|---|---|
| Falso positivo de violacao por evento duplicado | alto | integrar com S-PC-01-003 (idempotencia) | Backend Lead |

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
| 2026-02-09 | PO | aprovado | owner final e thresholds operacionais aprovados |
