# Story S-PC-01-003 - Idempotency and Version Guard

## 1. Metadados
- Story ID: S-PC-01-003
- Titulo: Padronizar idempotencia e `version_guard` nos side-effects
- Fase: 04-PO-Sharding
- Fonte consolidada (PC-P0-*): PC-P0-01
- ADR relacionado: D-AR-001, D-AR-002
- Prioridade/Onda: P0 / O1
- Owner: Backend + QA
- Data: 2026-02-09
- Status: ready_for_implementation

## 2. Objetivo da story
- Problema que a story resolve: duplicidade ou reexecucao tardia pode aplicar side-effect invalido.
- Resultado operacional esperado: cada side-effect usa chave de idempotencia e valida versao antes de executar.

## 3. Escopo
- In scope:
  - padrao unico de `idempotency_key`.
  - regra de `version_guard` obrigatoria por side-effect sensivel.
- Out of scope:
  - politicas de expiracao TTL (stories PC-02).
  - safe mode (stories PC-03).

## 4. Regras congeladas aplicaveis
- [x] D-AR-001 commit causal por `contact_id`
- [x] D-AR-002 replay com TTL + version guard
- [ ] D-AR-003 safe mode por falta de ACK em 15 min
- [ ] D-AR-004 saida safe mode com ACK + recovery auditavel + janela de estabilizacao
- [x] D-AR-005 observabilidade por fluxo com `correlation_id`
- [x] D-AR-006 lock/idempotencia Redis + fallback DB
- [x] Secao 7 consolidacao (TTL e parametros operacionais aprovados)

## 5. Contrato funcional da story
1. Evento de entrada: intento de side-effect (agendar/reagendar/cancelar/confirmacao D-1).
2. Regras de processamento:
   - construir `idempotency_key` deterministica.
   - validar `version_guard` contra estado corrente.
3. Side-effects permitidos:
   - executar side-effect somente quando idempotencia/versao validas.
4. Resultados terminais:
   - `applied_once`
   - `duplicate_ignored`
   - `version_conflict_blocked`
5. Tratamento de erro:
   - erro de persistencia entra em retry controlado sem duplicar efeito.

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
- SLO/SLA impactado: evita retrabalho operacional e protege SLA comercial.
- Limites de capacidade relevantes: carga padrao e picos de 18 msg/min.
- Impacto em custo/latencia: baixo aumento por checagem de chave/versao.
- Modo de contingencia: fallback DB e fila manual para conflitos persistentes.

## 9. Evidencias de teste obrigatorias
1. Reenvio identico de evento sem duplicar side-effect.
2. Evento com versao antiga gerando `version_conflict_blocked`.
3. Falha de Redis com continuidade via fallback DB.
4. Evidencia de log com `idempotency_key`, `version_guard`, resultado terminal.

## 10. Runbook e resposta a incidente
- Trigger tecnico: `version_conflict_blocked > 2%` em 60 min ou `>= 8/h` (warning); `> 5%` em 60 min ou `>= 20/h` (critico).
- Acao imediata: pausar side-effects da intent afetada e revisar origem de versao.
- Owner on-call / superadmin: Backend on-call + QA lead.
- Escalonamento: Product/Ops quando conflito impactar fila manual.
- Criterio de retorno ao estado normal: `version_conflict_blocked <= 2%` em 60 min e fila manual drenada.

## 11. Dependencias
- Dependencias tecnicas: S-PC-01-002 concluida.
- Dependencias de produto/operacao: tabela de intents sensiveis fechada.
- Ordem de execucao: terceira story da trilha PC-01.

## 12. Riscos residuais
| Risco | Severidade | Mitigacao | Owner |
|---|---|---|---|
| Chave de idempotencia mal definida em intent nova | alto | checklist de contrato e QA gate obrigatorio | Backend + QA |

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
