# Story S-PC-04-003 - Operational Evidence Pack per Flow

## 1. Metadados
- Story ID: S-PC-04-003
- Titulo: Evidencia operacional por fluxo para triagem/auditoria
- Fase: 04-PO-Sharding
- Fonte consolidada (PC-P0-*): PC-P0-04
- ADR relacionado: D-AR-005
- Prioridade/Onda: P0 / O3
- Owner: SRE + QA
- Data: 2026-02-09
- Status: ready_for_po_review

## 2. Objetivo da story
- Problema que a story resolve: sem pacote de evidencia padronizado, auditoria e triagem de incidentes ficam lentas e subjetivas.
- Resultado operacional esperado: cada fluxo F-01..F-06 gera evidence pack consistente para investigacao tecnica e validacao QA.

## 3. Escopo
- In scope:
  - formato padrao de evidence pack por fluxo.
  - consolidacao de logs, metricas, alertas, estado terminal e timeline.
  - rastreabilidade por `correlation_id`.
- Out of scope:
  - relatorios executivos de negocio.
  - pipeline de BI historico.

## 4. Regras congeladas aplicaveis
- [x] D-AR-001 commit causal por `contact_id`
- [x] D-AR-002 replay com TTL + version guard
- [x] D-AR-003 safe mode por falta de ACK em 15 min
- [x] D-AR-004 saida safe mode com ACK + recovery auditavel + janela de estabilizacao
- [x] D-AR-005 observabilidade por fluxo com `correlation_id`
- [x] D-AR-006 lock/idempotencia Redis + fallback DB
- [x] Secao 7 consolidacao (TTL e parametros operacionais aprovados)

## 5. Contrato funcional da story
1. Evento de entrada: fim de execucao de fluxo (F-01..F-06) ou trigger de incidente.
2. Regras de processamento:
   - coletar dados obrigatorios do fluxo.
   - montar evidence pack com esquema unico.
   - disponibilizar artefato para SRE/QA/Ops.
3. Side-effects permitidos:
   - persistencia de evidence pack com referencia auditavel.
4. Resultados terminais:
   - `evidence_pack_generated`
   - `evidence_pack_partial`
   - `evidence_pack_failed_alerted`
5. Tratamento de erro:
   - falha de montagem gera alerta e reprocessamento controlado.

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
- SLO/SLA impactado: acelera triagem e reduz tempo de analise em incidentes.
- Limites de capacidade relevantes: geracao de evidence nao pode impactar p95 de fluxo.
- Impacto em custo/latencia: aumento moderado de armazenamento e processamento.
- Modo de contingencia: evidence parcial com reprocessamento e alerta.

## 9. Evidencias de teste obrigatorias
1. Evidence pack completo para cada fluxo F-01..F-06.
2. Correlation entre logs, metricas e alertas no mesmo pacote.
3. Falha parcial gera `evidence_pack_partial` e alerta.
4. QA consegue reproduzir timeline do evento com o pack.

## 10. Runbook e resposta a incidente
- Trigger tecnico: `evidence_pack_completeness < 98%` em 60 min (warning); `< 95%` em 60 min (critico). `evidence_pack_generation_latency_p95 > 15 min` (warning); `> 30 min` (critico).
- Acao imediata: identificar campos faltantes e forcar reprocessamento do pack.
- Owner on-call / superadmin: SRE on-call + QA lead.
- Escalonamento: Platform quando falha for de pipeline compartilhado.
- Criterio de retorno ao estado normal: completude >= 98% e p95 de geracao <= 15 min por 60 min.

## 11. Dependencias
- Dependencias tecnicas: S-PC-04-001 e S-PC-04-002 concluidas.
- Dependencias de produto/operacao: esquema de evidence pack aprovado.
- Ordem de execucao: primeira story da O3.

## 12. Riscos residuais
| Risco | Severidade | Mitigacao | Owner |
|---|---|---|---|
| Evidence incompleta em incidente critico | alto | threshold de completude + alerta + reprocessamento forcado | SRE + QA |

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
