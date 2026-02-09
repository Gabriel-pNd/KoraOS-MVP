# Story S-PC-02-001 - Replay TTL Validation

## 1. Metadados
- Story ID: S-PC-02-001
- Titulo: Validar TTL por intent antes de replay
- Fase: 04-PO-Sharding
- Fonte consolidada (PC-P0-*): PC-P0-02
- ADR relacionado: D-AR-002
- Prioridade/Onda: P0 / O1
- Owner: Backend (apoio: Ops)
- Data: 2026-02-09
- Status: ready_for_implementation

## 2. Objetivo da story
- Problema que a story resolve: replay tardio pode executar efeito fora de contexto.
- Resultado operacional esperado: replay somente dentro da janela TTL aprovada por intent.

## 3. Escopo
- In scope:
  - validacao de TTL antes de executar replay.
  - tabela de TTL aplicada:
    - `schedule/reschedule/cancel = 120 min`
    - `D-1 confirmation = ate appointment_start - 30 min`
    - `follow-up nao transacional = 24h`
- Out of scope:
  - conciliacao de conflito de versao (S-PC-02-002).
  - definicao de fila manual detalhada (S-PC-02-003).

## 4. Regras congeladas aplicaveis
- [ ] D-AR-001 commit causal por `contact_id`
- [x] D-AR-002 replay com TTL + version guard
- [ ] D-AR-003 safe mode por falta de ACK em 15 min
- [ ] D-AR-004 saida safe mode com ACK + recovery auditavel + janela de estabilizacao
- [x] D-AR-005 observabilidade por fluxo com `correlation_id`
- [ ] D-AR-006 lock/idempotencia Redis + fallback DB
- [x] Secao 7 consolidacao (TTL e parametros operacionais aprovados)

## 5. Contrato funcional da story
1. Evento de entrada: evento pendente para replay.
2. Regras de processamento:
   - identificar intent e timestamp original.
   - comparar idade do evento com TTL da intent.
3. Side-effects permitidos:
   - executar replay apenas se TTL valido.
4. Resultados terminais:
   - `ttl_valid_ready_for_replay`
   - `expired_manual`
5. Tratamento de erro:
   - evento sem timestamp vai para `invalid_event_manual`.

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
- SLO/SLA impactado: evita side-effect tardio e protege confiabilidade do beta.
- Limites de capacidade relevantes: dreno de backlog em pico sem violar TTL.
- Impacto em custo/latencia: minimo, apenas validacao temporal por evento.
- Modo de contingencia: expirado segue para tarefa manual com prioridade operacional.

## 9. Evidencias de teste obrigatorias
1. Replay dentro de TTL segue para execucao.
2. Replay expirado resulta em `expired_manual`.
3. Casos limite no D-1 (ate `appointment_start - 30 min`).
4. Logs com `intent`, `event_age`, `ttl_limit`, `result`.

## 10. Runbook e resposta a incidente
- Trigger tecnico: `expired_manual > 3%` em 60 min (warning); `> 8%` em 60 min ou `> 30/h` (critico).
- Acao imediata: verificar delay de fila e gargalo de processamento.
- Owner on-call / superadmin: Backend on-call + Ops.
- Escalonamento: Platform se backlog de replay nao drenar.
- Criterio de retorno ao estado normal: `expired_manual <= 3%` em 60 min e fila de expirados estabilizada.

## 11. Dependencias
- Dependencias tecnicas: S-PC-01-003 concluida.
- Dependencias de produto/operacao: tabela TTL aprovada (ja congelada na secao 7).
- Ordem de execucao: inicio da trilha PC-02.

## 12. Riscos residuais
| Risco | Severidade | Mitigacao | Owner |
|---|---|---|---|
| Clock skew entre componentes afetar calculo TTL | alto | usar timestamp de referencia unico e monitorar skew | Backend |

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
