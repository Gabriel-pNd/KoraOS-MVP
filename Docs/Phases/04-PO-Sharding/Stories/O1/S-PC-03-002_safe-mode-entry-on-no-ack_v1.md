# Story S-PC-03-002 - Safe Mode Entry on No ACK

## 1. Metadados
- Story ID: S-PC-03-002
- Titulo: Entrada em safe mode em 15 min sem ACK com politicas de bloqueio/enfileiramento
- Fase: 04-PO-Sharding
- Fonte consolidada (PC-P0-*): PC-P0-03
- ADR relacionado: D-AR-003, D-AR-004
- Prioridade/Onda: P0 / O1
- Owner: DevOps + Backend
- Data: 2026-02-09
- Status: ready_for_po_review

## 2. Objetivo da story
- Problema que a story resolve: sem ACK critico, o sistema pode continuar aplicando side-effects inseguros.
- Resultado operacional esperado: fail-safe automatico em 15 min sem ACK com preservacao de ingestao.

## 3. Escopo
- In scope:
  - gatilho de safe mode apos 15 min sem ACK.
  - bloqueio de side-effects sensiveis (agendar/reagendar/cancelar).
  - ingestao normal e enfileiramento de pendencias.
  - envio de mensagem padrao de contingencia.
  - abertura de ticket critico para acao no proximo turno.
- Out of scope:
  - criterio de saida de safe mode (O2 - S-PC-03-004).
  - tuning de thresholds de alerta secundarios.

## 4. Regras congeladas aplicaveis
- [ ] D-AR-001 commit causal por `contact_id`
- [ ] D-AR-002 replay com TTL + version guard
- [x] D-AR-003 safe mode por falta de ACK em 15 min
- [x] D-AR-004 saida safe mode com ACK + recovery auditavel + janela de estabilizacao
- [x] D-AR-005 observabilidade por fluxo com `correlation_id`
- [ ] D-AR-006 lock/idempotencia Redis + fallback DB
- [x] Secao 7 consolidacao (TTL e parametros operacionais aprovados)

## 5. Contrato funcional da story
1. Evento de entrada: timeout de ACK critico (15 min).
2. Regras de processamento:
   - ativar estado global `safe_mode_active`.
   - bloquear side-effects de agenda.
   - manter ingestao de mensagens e colocar pendencias em fila de contingencia.
   - enviar mensagem padrao de contingencia para interlocutor.
   - abrir ticket critico para proximo turno.
3. Side-effects permitidos:
   - atualizacao de estado de seguranca, notificacao de contingencia, abertura de ticket.
4. Resultados terminais:
   - `safe_mode_active`
   - `safe_mode_activation_failed`
5. Tratamento de erro:
   - falha de ativacao gera alerta P0 para superadmin e tentativa de reativacao.

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
- [ ] Saida exige ACK + recovery action + 10 min de health checks verdes.

### 7.4 Observabilidade e alerta
- [x] Logs estruturados com `correlation_id`.
- [x] Sinal de alerta definido (trigger -> canal -> owner -> SLA ACK).
- [x] Evidencia para auditoria/triagem disponivel.

### 7.5 Degradacao e fallback
- [x] Falha de dependencia (ex.: Redis) possui fallback declarado.
- [x] Continuacao controlada sem side-effect invalido.

## 8. NFR e operacao
- SLO/SLA impactado: protege integridade operacional em incidente P0.
- Limites de capacidade relevantes: ingestao nao pode parar em safe mode.
- Impacto em custo/latencia: aumento de backlog temporario em fila de contingencia.
- Modo de contingencia: manual queue + ticket critico para acao no proximo turno.

## 9. Evidencias de teste obrigatorias
1. Sem ACK por 15 min aciona `safe_mode_active`.
2. Em safe mode, side-effects de agenda ficam bloqueados.
3. Ingestao continua e pendencias sao enfileiradas.
4. Mensagem padrao e ticket critico sao emitidos.

## 10. Runbook e resposta a incidente
- Trigger tecnico: `ack_timeout_15m`.
- Acao imediata: confirmar ativacao do safe mode e comunicar operacao.
- Owner on-call / superadmin: superadmin + DevOps on-call.
- Escalonamento: incident commander se ativacao falhar.
- Criterio de retorno ao estado normal: apenas via fluxo de saida auditavel (story O2).

## 11. Dependencias
- Dependencias tecnicas: S-PC-03-001 concluida.
- Dependencias de produto/operacao: mensagem padrao de contingencia aprovada.
- Ordem de execucao: segunda story da trilha PC-03 na O1.

## 12. Riscos residuais
| Risco | Severidade | Mitigacao | Owner |
|---|---|---|---|
| Fila de contingencia crescer alem da capacidade do turno | alto | alertas de backlog + priorizacao por intent critica | DevOps + Ops |

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
