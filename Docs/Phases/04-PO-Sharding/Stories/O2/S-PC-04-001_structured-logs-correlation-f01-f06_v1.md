# Story S-PC-04-001 - Structured Logs Correlation F-01..F-06

## 1. Metadados
- Story ID: S-PC-04-001
- Titulo: Logs estruturados com `correlation_id` fim a fim (F-01..F-06)
- Fase: 04-PO-Sharding
- Fonte consolidada (PC-P0-*): PC-P0-04
- ADR relacionado: D-AR-005
- Prioridade/Onda: P0 / O2
- Owner: SRE
- Data: 2026-02-09
- Status: ready_for_po_review

## 2. Objetivo da story
- Problema que a story resolve: sem logs padronizados, investigacao de incidentes fica lenta e incompleta.
- Resultado operacional esperado: todos os fluxos criticos emitem logs estruturados com `correlation_id` reutilizavel.

## 3. Escopo
- In scope:
  - schema minimo de log para F-01..F-06.
  - campos obrigatorios: `correlation_id`, `contact_id`, `flow_id`, `intent`, `status`, `ts`.
  - trilha para safe mode e replay.
- Out of scope:
  - dashboards finais de negocio.
  - retencao historica de longo prazo.

## 4. Regras congeladas aplicaveis
- [x] D-AR-001 commit causal por `contact_id`
- [x] D-AR-002 replay com TTL + version guard
- [x] D-AR-003 safe mode por falta de ACK em 15 min
- [x] D-AR-004 saida safe mode com ACK + recovery auditavel + janela de estabilizacao
- [x] D-AR-005 observabilidade por fluxo com `correlation_id`
- [ ] D-AR-006 lock/idempotencia Redis + fallback DB
- [x] Secao 7 consolidacao (TTL e parametros operacionais aprovados)

## 5. Contrato funcional da story
1. Evento de entrada: qualquer evento tecnico/negocio em F-01..F-06.
2. Regras de processamento:
   - emitir log estruturado por etapa de fluxo.
   - propagar `correlation_id` entre componentes.
3. Side-effects permitidos:
   - persistencia e indexacao de log.
4. Resultados terminais:
   - `log_emitted_structured`
   - `log_emit_failed_alerted`
5. Tratamento de erro:
   - falha de emissao deve gerar alerta sem interromper processamento principal.

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
- SLO/SLA impactado: reduz MTTR por facilitar rastreamento ponta a ponta.
- Limites de capacidade relevantes: overhead de logs nao pode degradar p95 operacional.
- Impacto em custo/latencia: aumento de custo de storage e indexacao.
- Modo de contingencia: em falha de sink, buffer local + alerta P1.

## 9. Evidencias de teste obrigatorias
1. Logs em todos os fluxos F-01..F-06 com schema valido.
2. Propagacao correta de `correlation_id` entre servicos.
3. Falha de sink de logs gera alerta sem quebrar fluxo.
4. Relatorio de cobertura de campos obrigatorios.

## 10. Runbook e resposta a incidente
- Trigger tecnico: cobertura de `correlation_id` < 99.5% em 15 min (warning); < 98% em 15 min (critico).
- Acao imediata: identificar componente sem propagacao e aplicar rollback/feature flag.
- Owner on-call / superadmin: SRE on-call.
- Escalonamento: Platform quando perda de log afetar auditoria.
- Criterio de retorno ao estado normal: cobertura de `correlation_id` >= 99.5% por 30 min.

## 11. Dependencias
- Dependencias tecnicas: nenhuma bloqueante.
- Dependencias de produto/operacao: definicao final do schema de logs.
- Ordem de execucao: terceira story da O2.

## 12. Riscos residuais
| Risco | Severidade | Mitigacao | Owner |
|---|---|---|---|
| Falhas silenciosas de log em componente secundario | alto | monitor de cobertura + alerta por fluxo | SRE |

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
