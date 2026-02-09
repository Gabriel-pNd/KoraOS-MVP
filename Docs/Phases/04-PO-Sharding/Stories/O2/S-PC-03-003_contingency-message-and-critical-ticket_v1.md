# Story S-PC-03-003 - Contingency Message and Critical Ticket

## 1. Metadados
- Story ID: S-PC-03-003
- Titulo: Mensagem padrao de contingencia e ticket critico para proximo turno
- Fase: 04-PO-Sharding
- Fonte consolidada (PC-P0-*): PC-P0-03
- ADR relacionado: D-AR-003, D-AR-004
- Prioridade/Onda: P0 / O2
- Owner: Ops + Product
- Data: 2026-02-09
- Status: ready_for_po_review

## 2. Objetivo da story
- Problema que a story resolve: durante safe mode, usuarios podem ficar sem contexto e o time pode perder continuidade no proximo turno.
- Resultado operacional esperado: envio de mensagem padrao de contingencia e abertura automatica de ticket critico com contexto rastreavel.

## 3. Escopo
- In scope:
  - template padrao de contingencia por tipo de intent.
  - abertura automatica de ticket critico com prioridade e contexto tecnico.
  - associacao ticket <-> correlation_id.
- Out of scope:
  - saida de safe mode (S-PC-03-004).
  - automacoes de triagem avancada de tickets.

## 4. Regras congeladas aplicaveis
- [ ] D-AR-001 commit causal por `contact_id`
- [ ] D-AR-002 replay com TTL + version guard
- [x] D-AR-003 safe mode por falta de ACK em 15 min
- [x] D-AR-004 saida safe mode com ACK + recovery auditavel + janela de estabilizacao
- [x] D-AR-005 observabilidade por fluxo com `correlation_id`
- [ ] D-AR-006 lock/idempotencia Redis + fallback DB
- [x] Secao 7 consolidacao (TTL e parametros operacionais aprovados)

## 5. Contrato funcional da story
1. Evento de entrada: `safe_mode_active` apos timeout de ACK.
2. Regras de processamento:
   - selecionar template de contingencia conforme intent e horario.
   - enviar mensagem de contingencia no canal permitido.
   - abrir ticket critico para proximo turno com prioridade P0.
3. Side-effects permitidos:
   - mensagem outbound de contingencia.
   - criacao/atualizacao de ticket critico.
4. Resultados terminais:
   - `contingency_message_sent_ticket_opened`
   - `contingency_message_failed_ticket_opened`
   - `ticket_open_failed_alerted`
5. Tratamento de erro:
   - se envio de mensagem falhar, manter ticket e gerar alerta para ops.

## 6. Criterios de aceite (base)
1. Fluxo principal executa conforme contrato definido.
2. Fluxo alternativo/erro retorna estado terminal conhecido.
3. Nenhum side-effect ocorre fora das regras de seguranca operacional.

## 7. Criterios de aceite delta (obrigatorios)
### 7.1 Concorrencia e commit causal
- [ ] `dispatch_priority` nao altera `commit_order`.
- [ ] Conflito de versao resulta em bloqueio seguro e auditavel.

### 7.2 Replay e fences
- [ ] TTL validado antes de qualquer side-effect.
- [ ] `as_of`/versao validada antes de replay.
- [ ] Estados terminais padronizados: `replayed`, `expired_manual`, `conflict_blocked`.

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
- SLO/SLA impactado: melhora continuidade operacional no proximo turno.
- Limites de capacidade relevantes: volume de ticket critico nao pode saturar fila de ops.
- Impacto em custo/latencia: baixo, com custo adicional de notificacao e ticketing.
- Modo de contingencia: se canal de mensagem falhar, ticket continua obrigatorio e alerta e disparado.

## 9. Evidencias de teste obrigatorias
1. Ativacao de safe mode envia mensagem padrao correta por intent.
2. Ticket critico e aberto automaticamente com correlation_id.
3. Falha no envio de mensagem ainda abre ticket e gera alerta.
4. Relatorio com status terminais e tempos de abertura de ticket.

## 10. Runbook e resposta a incidente
- Trigger tecnico: `contingency_message_delivery_failure_rate > 2%` em 15 min (warning); `> 5%` em 15 min ou `> 10 falhas/h` (critico).
- Acao imediata: validar canal de envio e abrir fallback operacional manual.
- Owner on-call / superadmin: Ops lead + superadmin.
- Escalonamento: Product se templates exigirem ajuste de conteudo.
- Criterio de retorno ao estado normal: falha de envio <= 2% em 15 min e ticket_open_latency_p95 <= 5 min.

## 11. Dependencias
- Dependencias tecnicas: S-PC-03-002 concluida.
- Dependencias de produto/operacao: texto padrao de contingencia aprovado.
- Ordem de execucao: primeira story da O2.

## 12. Riscos residuais
| Risco | Severidade | Mitigacao | Owner |
|---|---|---|---|
| Canal de mensagem indisponivel durante safe mode | alto | fallback operacional + ticket obrigatorio + alerta | Ops + Product |

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
