# Story S-PC-04-002 - Operational Alerts Matrix

## 1. Metadados
- Story ID: S-PC-04-002
- Titulo: Alertas operacionais (no ACK, gap ACK->enqueue, takeover SLA breach, replay backlog)
- Fase: 04-PO-Sharding
- Fonte consolidada (PC-P0-*): PC-P0-04
- ADR relacionado: D-AR-005
- Prioridade/Onda: P0 / O2
- Owner: SRE + QA
- Data: 2026-02-09
- Status: ready_for_po_review

## 2. Objetivo da story
- Problema que a story resolve: sem matriz unica de alertas, incidentes criticos podem ser detectados tarde.
- Resultado operacional esperado: todos os alertas P0/P1 principais com trigger numerico, canal, owner e SLA de ACK definidos.

## 3. Escopo
- In scope:
  - consolidar alertas de no ACK, gap ACK->enqueue, takeover SLA breach e replay backlog.
  - padronizar severidade, destinatario e janela de observacao.
  - validar rotas de notificacao e ACK tecnico.
- Out of scope:
  - ajustes finos de thresholds pos-beta.
  - alertas de produto nao-operacionais.

## 4. Regras congeladas aplicaveis
- [x] D-AR-001 commit causal por `contact_id`
- [x] D-AR-002 replay com TTL + version guard
- [x] D-AR-003 safe mode por falta de ACK em 15 min
- [x] D-AR-004 saida safe mode com ACK + recovery auditavel + janela de estabilizacao
- [x] D-AR-005 observabilidade por fluxo com `correlation_id`
- [ ] D-AR-006 lock/idempotencia Redis + fallback DB
- [x] Secao 7 consolidacao (TTL e parametros operacionais aprovados)

## 5. Contrato funcional da story
1. Evento de entrada: amostras continuas de metricas operacionais por fluxo.
2. Regras de processamento:
   - avaliar thresholds por alerta.
   - notificar owner primario e fallback.
   - exigir ACK e registrar trilha.
3. Side-effects permitidos:
   - emissao de alerta.
   - abertura de incidente quando severidade critica.
4. Resultados terminais:
   - `alert_fired_acknowledged`
   - `alert_fired_no_ack_escalated`
5. Tratamento de erro:
   - falha de canal dispara fallback e registra tentativa.

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
- [x] Entrada em safe mode ocorre em 15 min sem ACK.
- [x] Em safe mode: side-effects bloqueados, ingestao mantida, pendencias enfileiradas.
- [x] Saida exige ACK + recovery action + 10 min de health checks verdes.

### 7.4 Observabilidade e alerta
- [x] Logs estruturados com `correlation_id`.
- [x] Sinal de alerta definido (trigger -> canal -> owner -> SLA ACK).
- [x] Evidencia para auditoria/triagem disponivel.

### 7.5 Degradacao e fallback
- [x] Falha de dependencia (ex.: Redis) possui fallback declarado.
- [x] Continuacao controlada sem side-effect invalido.

## 8. NFR e operacao
- SLO/SLA impactado: melhora deteccao precoce e reduz tempo de resposta a incidente.
- Limites de capacidade relevantes: volume de alertas nao pode causar ruido excessivo.
- Impacto em custo/latencia: custo moderado com integracoes de alerta.
- Modo de contingencia: fallback para canal secundario e abertura automatica de ticket.

## 9. Evidencias de teste obrigatorias
1. Alertas disparam corretamente para cada trigger.
2. Sem ACK no prazo, escalonamento e executado.
3. ACK encerra ciclo sem duplicidade.
4. Matriz consolidada com historico de disparo e ownership.

## 10. Runbook e resposta a incidente
- Trigger tecnico:
  - `no_ack_critical_alert`: warning 5 min, alto 10 min, critico 15 min.
  - `ack_to_enqueue_gap`: `p95 > 2 min` (warning), `p95 > 5 min` ou `> 20 eventos` (critico) em 15 min.
  - `takeover_sla_breach_rate`: `> 5%` em 60 min (warning), `> 12%` em 60 min (critico).
  - `replay_backlog`: `> 30` ou `p95 idade > 15 min` (warning); `> 80` ou `p95 idade > 30 min` (critico).
- Acao imediata: validar origem do trigger e executar playbook por tipo de alerta.
- Owner on-call / superadmin: SRE on-call + superadmin.
- Escalonamento: QA e Product quando impacto em SLA de negocio.
- Criterio de retorno ao estado normal: todos os alertas criticos abaixo de threshold por 30 min.

## 11. Dependencias
- Dependencias tecnicas: S-PC-04-001 concluida.
- Dependencias de produto/operacao: owners e canais de alerta nomeados.
- Ordem de execucao: quarta story da O2.

## 12. Riscos residuais
| Risco | Severidade | Mitigacao | Owner |
|---|---|---|---|
| Alert fatigue por threshold agressivo | alto | revisao quinzenal de ruido + ajuste controlado | SRE + QA |

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
