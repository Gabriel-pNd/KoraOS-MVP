# Story S-PC-03-004 - Safe Mode Exit Controlled Recovery

## 1. Metadados
- Story ID: S-PC-03-004
- Titulo: Saida do safe mode com ACK + recovery action + 10 min health green
- Fase: 04-PO-Sharding
- Fonte consolidada (PC-P0-*): PC-P0-03
- ADR relacionado: D-AR-003, D-AR-004
- Prioridade/Onda: P0 / O2
- Owner: DevOps + Ops
- Data: 2026-02-09
- Status: ready_for_po_review

## 2. Objetivo da story
- Problema que a story resolve: sair de safe mode cedo demais pode reintroduzir side-effects inseguros.
- Resultado operacional esperado: saida somente com checklist completo, ACK valido e estabilizacao tecnica.

## 3. Escopo
- In scope:
  - validacao de ACK antes do inicio da recuperacao.
  - registro auditavel de `recovery_action`.
  - janela obrigatoria de 10 min de health checks verdes.
  - desbloqueio controlado de side-effects.
- Out of scope:
  - analise de causa raiz pos-incidente.
  - tuning de threshold apos beta.

## 4. Regras congeladas aplicaveis
- [ ] D-AR-001 commit causal por `contact_id`
- [ ] D-AR-002 replay com TTL + version guard
- [x] D-AR-003 safe mode por falta de ACK em 15 min
- [x] D-AR-004 saida safe mode com ACK + recovery auditavel + janela de estabilizacao
- [x] D-AR-005 observabilidade por fluxo com `correlation_id`
- [ ] D-AR-006 lock/idempotencia Redis + fallback DB
- [x] Secao 7 consolidacao (TTL e parametros operacionais aprovados)

## 5. Contrato funcional da story
1. Evento de entrada: `safe_mode_active` com ACK recebido.
2. Regras de processamento:
   - verificar checklist de recovery.
   - validar health checks verdes por 10 min sem interrupcao.
   - desbloquear side-effects em ordem controlada.
3. Side-effects permitidos:
   - alteracao de estado de seguranca.
   - reativacao progressiva de fluxos de agenda.
4. Resultados terminais:
   - `safe_mode_exit_completed`
   - `safe_mode_exit_denied_missing_checklist`
   - `safe_mode_exit_aborted_health_unstable`
5. Tratamento de erro:
   - qualquer falha retorna para `safe_mode_active` e registra motivo.

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
- SLO/SLA impactado: reduz risco de retorno inseguro e reincidencia de incidente.
- Limites de capacidade relevantes: health checks devem cobrir caminhos criticos F-01..F-06.
- Impacto em custo/latencia: atraso controlado de retorno por janela obrigatoria de 10 min.
- Modo de contingencia: se instavel, manter safe mode e escalar incident command.

## 9. Evidencias de teste obrigatorias
1. Sem checklist completo, saida e bloqueada.
2. Com checklist + 10 min health green, saida e concluida.
3. Health check vermelho durante janela aborta saida.
4. Log de auditoria com `ack_id`, `recovery_action`, `health_window`.

## 10. Runbook e resposta a incidente
- Trigger tecnico: reentrada em safe mode `>= 2` vezes em 60 min (warning); `>= 3` vezes em 60 min ou tentativa de saida sem checklist (critico).
- Acao imediata: bloquear novas tentativas de saida e revisar recovery checklist.
- Owner on-call / superadmin: DevOps on-call + superadmin.
- Escalonamento: incident commander e architecture owner.
- Criterio de retorno ao estado normal: `safe_mode_exit_completed` sem nova reentrada por 60 min.

## 11. Dependencias
- Dependencias tecnicas: S-PC-03-002 concluida.
- Dependencias de produto/operacao: checklist de recovery aprovado.
- Ordem de execucao: segunda story da O2.

## 12. Riscos residuais
| Risco | Severidade | Mitigacao | Owner |
|---|---|---|---|
| Retorno ao modo normal com health parcialmente degradado | critico | janela fixa de 10 min + abort automatico + auditoria | DevOps + Ops |

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
