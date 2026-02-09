# Story S-PC-05-002 - Redis Failure Drill with Controlled Continuity

## 1. Metadados
- Story ID: S-PC-05-002
- Titulo: Teste de falha Redis com continuidade controlada e sem side-effect invalido
- Fase: 04-PO-Sharding
- Fonte consolidada (PC-P0-*): PC-P0-05
- ADR relacionado: D-AR-006
- Prioridade/Onda: P0 / O3
- Owner: Platform + QA
- Data: 2026-02-09
- Status: ready_for_po_review

## 2. Objetivo da story
- Problema que a story resolve: fallback teorico sem drill real pode falhar em producao.
- Resultado operacional esperado: cenarios de falha Redis testados com continuidade controlada, sem side-effect invalido e com evidencias auditaveis.

## 3. Escopo
- In scope:
  - roteiro de teste de falha Redis em ambiente controlado.
  - validacao do fallback DB para lock/idempotencia.
  - comprovacao de ausencia de side-effects invalidos.
  - relatorio de continuidade e recuperacao.
- Out of scope:
  - simulacao de desastre multirregional.
  - alteracoes arquiteturais fora de D-AR-006.

## 4. Regras congeladas aplicaveis
- [x] D-AR-001 commit causal por `contact_id`
- [x] D-AR-002 replay com TTL + version guard
- [ ] D-AR-003 safe mode por falta de ACK em 15 min
- [ ] D-AR-004 saida safe mode com ACK + recovery auditavel + janela de estabilizacao
- [x] D-AR-005 observabilidade por fluxo com `correlation_id`
- [x] D-AR-006 lock/idempotencia Redis + fallback DB
- [x] Secao 7 consolidacao (TTL e parametros operacionais aprovados)

## 5. Contrato funcional da story
1. Evento de entrada: disparo de drill de falha Redis.
2. Regras de processamento:
   - forcar indisponibilidade Redis controlada.
   - ativar fallback DB para locks e idempotencia.
   - validar continuidade dos fluxos sem side-effects invalidos.
   - restaurar Redis e voltar para modo primario.
3. Side-effects permitidos:
   - alteracao temporaria de modo de lock (`primary` -> `fallback` -> `primary`).
   - emissao de evidencias de teste.
4. Resultados terminais:
   - `drill_passed_controlled_continuity`
   - `drill_passed_with_warnings`
   - `drill_failed_side_effect_risk`
5. Tratamento de erro:
   - se side-effect invalido for detectado, bloquear continuidade e abrir incidente critico.

## 6. Criterios de aceite (base)
1. Fluxo principal executa conforme contrato definido.
2. Fluxo alternativo/erro retorna estado terminal conhecido.
3. Nenhum side-effect ocorre fora das regras de seguranca operacional.

## 7. Criterios de aceite delta (obrigatorios)
### 7.1 Concorrencia e commit causal
- [x] `dispatch_priority` nao altera `commit_order`.
- [x] Conflito de versao resulta em bloqueio seguro e auditavel.

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
- [x] Falha de dependencia (ex.: Redis) possui fallback declarado.
- [x] Continuacao controlada sem side-effect invalido.

## 8. NFR e operacao
- SLO/SLA impactado: aumenta confianca operacional em degradacao de dependencia critica.
- Limites de capacidade relevantes: fallback DB deve suportar carga de pico prevista.
- Impacto em custo/latencia: latencia maior em fallback, aceitavel dentro dos limites definidos.
- Modo de contingencia: se fallback degradar alem do limite, bloquear side-effects sensiveis.

## 9. Evidencias de teste obrigatorias
1. Drill com falha Redis controlada e ativacao automatica de fallback.
2. Nenhum side-effect invalido durante janela de fallback.
3. Recuperacao para modo primario com continuidade preservada.
4. Relatorio com tempos de deteccao, fallback e recuperacao.

## 10. Runbook e resposta a incidente
- Trigger tecnico: `drill_failure_rate > 0%` (critico). `invalid_side_effect_count > 0` (critico). `fallback_recovery_time > 10 min` (warning); `> 20 min` (critico). `fallback_db_lock_latency_p95 > 1200 ms` (critico).
- Acao imediata: interromper rollout, bloquear side-effects sensiveis e executar plano de contencao.
- Owner on-call / superadmin: Platform on-call + QA lead + superadmin.
- Escalonamento: Architecture owner e incident commander.
- Criterio de retorno ao estado normal: 100% dos drills validos em 2 execucoes consecutivas sem side-effect invalido.

## 11. Dependencias
- Dependencias tecnicas: S-PC-05-001 concluida.
- Dependencias de produto/operacao: janela de teste aprovada sem impacto no atendimento.
- Ordem de execucao: segunda story da O3.

## 12. Riscos residuais
| Risco | Severidade | Mitigacao | Owner |
|---|---|---|---|
| Fallback DB insuficiente em carga real | alto | drill recorrente + limites de carga + bloqueio seguro | Platform + QA |

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
