# Story S-PC-05-001 - Redis Lock and Idempotency with Fallback DB

## 1. Metadados
- Story ID: S-PC-05-001
- Titulo: Lock/idempotencia com Redis e fallback em DB
- Fase: 04-PO-Sharding
- Fonte consolidada (PC-P0-*): PC-P0-05
- ADR relacionado: D-AR-006
- Prioridade/Onda: P0 / O2
- Owner: Platform
- Data: 2026-02-09
- Status: ready_for_implementation

## 2. Objetivo da story
- Problema que a story resolve: indisponibilidade de Redis pode quebrar lock e idempotencia em concorrencia.
- Resultado operacional esperado: continuidade controlada com fallback em DB sem side-effects invalidos.

## 3. Escopo
- In scope:
  - lock primario em Redis com idempotency key.
  - fallback automatico para DB em degradacao.
  - telemetria de modo fallback e latencia.
- Out of scope:
  - HA completo de Redis (trilha pos-beta).
  - mudancas de arquitetura fora de D-AR-006.

## 4. Regras congeladas aplicaveis
- [x] D-AR-001 commit causal por `contact_id`
- [x] D-AR-002 replay com TTL + version guard
- [ ] D-AR-003 safe mode por falta de ACK em 15 min
- [ ] D-AR-004 saida safe mode com ACK + recovery auditavel + janela de estabilizacao
- [x] D-AR-005 observabilidade por fluxo com `correlation_id`
- [x] D-AR-006 lock/idempotencia Redis + fallback DB
- [x] Secao 7 consolidacao (TTL e parametros operacionais aprovados)

## 5. Contrato funcional da story
1. Evento de entrada: tentativa de lock/idempotencia para side-effect sensivel.
2. Regras de processamento:
   - usar Redis como backend primario de lock.
   - em falha de Redis, ativar fallback DB com mesma semantica de lock.
   - manter idempotency key unica por evento.
3. Side-effects permitidos:
   - persistencia de lock em Redis/DB.
   - registro de modo de operacao (`primary` ou `fallback`).
4. Resultados terminais:
   - `lock_acquired_primary`
   - `lock_acquired_fallback`
   - `lock_acquire_failed_safe_block`
5. Tratamento de erro:
   - falha simultanea de Redis/DB bloqueia side-effect e abre incidente critico.

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
- SLO/SLA impactado: protege disponibilidade de lock em incidentes de Redis.
- Limites de capacidade relevantes: DB fallback nao pode saturar com burst.
- Impacto em custo/latencia: aumento moderado de latencia em modo fallback.
- Modo de contingencia: se fallback degradar, bloquear side-effects e enviar para fila manual.

## 9. Evidencias de teste obrigatorias
1. Fluxo normal com Redis lock primario.
2. Falha Redis ativa fallback DB sem duplicar side-effect.
3. Falha simultanea Redis+DB bloqueia side-effect com alerta critico.
4. Relatorio de taxa de fallback e latencia p95 por modo.

## 10. Runbook e resposta a incidente
- Trigger tecnico: `redis_fallback_rate > 5%` em 15 min (warning); `> 20%` em 15 min (critico). `fallback_db_lock_latency_p95 > 500 ms` (warning); `> 1200 ms` (critico).
- Acao imediata: validar saude Redis, pressionar dreno de fila e proteger DB.
- Owner on-call / superadmin: Platform on-call + superadmin.
- Escalonamento: DevOps e Backend quando side-effects forem bloqueados.
- Criterio de retorno ao estado normal: fallback_rate <= 5% e p95 lock <= 500 ms por 30 min.

## 11. Dependencias
- Dependencias tecnicas: S-PC-01-003 concluida.
- Dependencias de produto/operacao: definicao de limite de backlog manual por lock failure.
- Ordem de execucao: quinta story da O2.

## 12. Riscos residuais
| Risco | Severidade | Mitigacao | Owner |
|---|---|---|---|
| Saturacao de DB durante fallback prolongado | alto | throttling de side-effects + fila manual priorizada | Platform |

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
