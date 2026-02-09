# Story S-PC-02-002 - Replay Version and AsOf Validation

## 1. Metadados
- Story ID: S-PC-02-002
- Titulo: Revalidar versao/as_of antes de replay
- Fase: 04-PO-Sharding
- Fonte consolidada (PC-P0-*): PC-P0-02
- ADR relacionado: D-AR-002
- Prioridade/Onda: P0 / O1
- Owner: Backend
- Data: 2026-02-09
- Status: ready_for_po_review

## 2. Objetivo da story
- Problema que a story resolve: replay com estado antigo pode sobrescrever estado mais novo.
- Resultado operacional esperado: replay so executa quando `as_of` e versao forem compativeis com estado atual.

## 3. Escopo
- In scope:
  - comparar versao de evento replay com versao corrente.
  - validar `as_of` da metrica/estado antes de executar.
- Out of scope:
  - padronizacao de status terminais (S-PC-02-003).
  - politica de alerta de no ACK (S-PC-03-001).

## 4. Regras congeladas aplicaveis
- [x] D-AR-001 commit causal por `contact_id`
- [x] D-AR-002 replay com TTL + version guard
- [ ] D-AR-003 safe mode por falta de ACK em 15 min
- [ ] D-AR-004 saida safe mode com ACK + recovery auditavel + janela de estabilizacao
- [x] D-AR-005 observabilidade por fluxo com `correlation_id`
- [ ] D-AR-006 lock/idempotencia Redis + fallback DB
- [x] Secao 7 consolidacao (TTL e parametros operacionais aprovados)

## 5. Contrato funcional da story
1. Evento de entrada: evento elegivel para replay apos validacao TTL.
2. Regras de processamento:
   - obter versao/as_of do evento.
   - comparar com snapshot atual da entidade alvo.
3. Side-effects permitidos:
   - aplicar replay somente em match de versao/as_of.
4. Resultados terminais:
   - `version_match_ready_for_replay`
   - `conflict_blocked`
5. Tratamento de erro:
   - ausencia de metadado de versao manda para `invalid_event_manual`.

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
- [ ] Falha de dependencia (ex.: Redis) possui fallback declarado.
- [ ] Continuacao controlada sem side-effect invalido.

## 8. NFR e operacao
- SLO/SLA impactado: evita regressao silenciosa em dados de agenda.
- Limites de capacidade relevantes: validacao deve suportar backlog de replay em pico.
- Impacto em custo/latencia: leitura extra de versao/as_of por replay.
- Modo de contingencia: conflitos seguem para fila manual com contexto completo.

## 9. Evidencias de teste obrigatorias
1. Replay com versao igual e `as_of` valido segue para execucao.
2. Replay com versao antiga retorna `conflict_blocked`.
3. Replay com `as_of` invalido retorna `conflict_blocked`.
4. Evidencia de logs com `expected_version`, `event_version`, `as_of`, `result`.

## 10. Runbook e resposta a incidente
- Trigger tecnico: aumento abrupto de `conflict_blocked`.
- Acao imediata: revisar origem dos eventos e drift de versao.
- Owner on-call / superadmin: Backend on-call.
- Escalonamento: Product/Ops quando conflito impactar confirmacoes D-1.
- Criterio de retorno ao estado normal: conflitos dentro do limite acordado e replay drenado.

## 11. Dependencias
- Dependencias tecnicas: S-PC-02-001 concluida.
- Dependencias de produto/operacao: definicao do campo `as_of` obrigatorio por intent.
- Ordem de execucao: segunda story da trilha PC-02.

## 12. Riscos residuais
| Risco | Severidade | Mitigacao | Owner |
|---|---|---|---|
| Origem enviar evento sem versao consistente | alto | validar contrato no ingresso e rejeitar evento invalido | Backend |

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
