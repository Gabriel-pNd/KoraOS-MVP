# Story Template P0 Delta v1

## 1. Metadados
- Story ID:
- Titulo:
- Fase: 04-PO-Sharding
- Fonte consolidada (PC-P0-*):
- ADR relacionado:
- Prioridade/Onda:
- Owner:
- Data:
- Status:

## 2. Objetivo da story
- Problema que a story resolve:
- Resultado operacional esperado:

## 3. Escopo
- In scope:
- Out of scope:

## 4. Regras congeladas aplicaveis
Marcar as que se aplicam:
- [ ] D-AR-001 commit causal por `contact_id`
- [ ] D-AR-002 replay com TTL + version guard
- [ ] D-AR-003 safe mode por falta de ACK em 15 min
- [ ] D-AR-004 saida safe mode com ACK + recovery auditavel + janela de estabilizacao
- [ ] D-AR-005 observabilidade por fluxo com `correlation_id`
- [ ] D-AR-006 lock/idempotencia Redis + fallback DB
- [ ] Secao 7 consolidacao (TTL e parametros operacionais aprovados)

## 5. Contrato funcional da story
1. Evento de entrada:
2. Regras de processamento:
3. Side-effects permitidos:
4. Resultados terminais:
5. Tratamento de erro:

## 6. Criterios de aceite (base)
1. Fluxo principal executa conforme contrato definido.
2. Fluxo alternativo/erro retorna estado terminal conhecido.
3. Nenhum side-effect ocorre fora das regras de seguranca operacional.

## 7. Criterios de aceite delta (obrigatorios)
Preencher os blocos aplicaveis.

### 7.1 Concorrencia e commit causal
- [ ] `dispatch_priority` nao altera `commit_order`.
- [ ] Conflito de versao resulta em bloqueio seguro e auditavel.

### 7.2 Replay e fences
- [ ] TTL validado antes de qualquer side-effect.
- [ ] `as_of`/versao validada antes de replay.
- [ ] Estados terminais padronizados: `replayed`, `expired_manual`, `conflict_blocked`.

### 7.3 Safe mode
- [ ] Entrada em safe mode ocorre em 15 min sem ACK.
- [ ] Em safe mode: side-effects bloqueados, ingestao mantida, pendencias enfileiradas.
- [ ] Saida exige ACK + recovery action + 10 min de health checks verdes.

### 7.4 Observabilidade e alerta
- [ ] Logs estruturados com `correlation_id`.
- [ ] Sinal de alerta definido (trigger -> canal -> owner -> SLA ACK).
- [ ] Evidencia para auditoria/triagem disponivel.

### 7.5 Degradacao e fallback
- [ ] Falha de dependencia (ex.: Redis) possui fallback declarado.
- [ ] Continuacao controlada sem side-effect invalido.

## 8. NFR e operacao
- SLO/SLA impactado:
- Limites de capacidade relevantes:
- Impacto em custo/latencia:
- Modo de contingencia:

## 9. Evidencias de teste obrigatorias
1. Cenarios de sucesso.
2. Cenarios de erro e conflito.
3. Cenarios de concorrencia/degradacao.
4. Evidencia de logs, metricas e alertas.

## 10. Runbook e resposta a incidente
- Trigger tecnico:
- Acao imediata:
- Owner on-call / superadmin:
- Escalonamento:
- Criterio de retorno ao estado normal:

## 11. Dependencias
- Dependencias tecnicas:
- Dependencias de produto/operacao:
- Ordem de execucao:

## 12. Riscos residuais
| Risco | Severidade | Mitigacao | Owner |
|---|---|---|---|
|  |  |  |  |

## 13. Checklist DoR
- [ ] Fonte PC/ADR referenciada.
- [ ] Contrato funcional fechado.
- [ ] CAs base + delta preenchidos.
- [ ] Owner e dependencias definidos.
- [ ] Evidencia de teste planejada.
- [ ] Alerta operacional definido.

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
