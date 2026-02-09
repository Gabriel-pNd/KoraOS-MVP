# Story S-PC-03-001 - Critical Alert Pipeline (No ACK)

## 1. Metadados
- Story ID: S-PC-03-001
- Titulo: Pipeline de alerta critico sem ACK (superadmin redundante + retry WhatsApp 5/5 min por 30 min)
- Fase: 04-PO-Sharding
- Fonte consolidada (PC-P0-*): PC-P0-03
- ADR relacionado: D-AR-003, D-AR-004
- Prioridade/Onda: P0 / O1
- Owner: Superadmin (apoio: DevOps)
- Data: 2026-02-09
- Status: ready_for_implementation

## 2. Objetivo da story
- Problema que a story resolve: alerta critico pode passar despercebido e deixar sistema em estado inseguro.
- Resultado operacional esperado: alerta redundante com ACK obrigatorio e retries controlados.

## 3. Escopo
- In scope:
  - matriz `trigger -> canal -> owner -> SLA ACK`.
  - alerta redundante para superadmin.
  - reenvio automatico no WhatsApp a cada 5 min por 30 min.
- Out of scope:
  - entrada em safe mode (S-PC-03-002).
  - saida de safe mode (O2).

## 4. Regras congeladas aplicaveis
- [ ] D-AR-001 commit causal por `contact_id`
- [ ] D-AR-002 replay com TTL + version guard
- [x] D-AR-003 safe mode por falta de ACK em 15 min
- [x] D-AR-004 saida safe mode com ACK + recovery auditavel + janela de estabilizacao
- [x] D-AR-005 observabilidade por fluxo com `correlation_id`
- [ ] D-AR-006 lock/idempotencia Redis + fallback DB
- [x] Secao 7 consolidacao (TTL e parametros operacionais aprovados)

## 5. Contrato funcional da story
1. Evento de entrada: trigger tecnico critico que exige ACK do superadmin.
2. Regras de processamento:
   - disparar alerta primario no canal configurado.
   - disparar alerta redundante para superadmin.
   - iniciar retries WhatsApp (5 min, maximo 30 min).
3. Side-effects permitidos:
   - notificacao e registro de trilha auditavel.
4. Resultados terminais:
   - `ack_received`
   - `ack_timeout_escalated`
5. Tratamento de erro:
   - falha de canal gera fallback para canal alternativo e log de erro.

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
- SLO/SLA impactado: reduz MTTA em incidente critico e protege confiabilidade operacional.
- Limites de capacidade relevantes: nao depender de equipe 24/7 da clinica; foco no superadmin.
- Impacto em custo/latencia: custo de notificacao adicional por redundancia e retries.
- Modo de contingencia: se canal principal falhar, usar canal alternativo e registrar tentativa.

## 9. Evidencias de teste obrigatorias
1. Trigger critico dispara alerta primario + redundante.
2. Sem ACK, retries acontecem 5/5 min ate 30 min.
3. ACK recebido interrompe retries.
4. Evidencia de log com `trigger_id`, canal, timestamp de envio, tentativa, ACK.

## 10. Runbook e resposta a incidente
- Trigger tecnico: `no_ack_critical_alert` com limiares de ACK em 5 min (warning), 10 min (alto) e fail-safe em 15 min (critico).
- Acao imediata: confirmar canais ativos e acompanhar tentativas.
- Owner on-call / superadmin: superadmin.
- Escalonamento: ao atingir 15 min sem ACK, acionar S-PC-03-002.
- Criterio de retorno ao estado normal: ACK registrado e trilha completa de alerta.

## 11. Dependencias
- Dependencias tecnicas: nenhuma previa bloqueante.
- Dependencias de produto/operacao: matriz trigger/canal/owner/SLA aprovada.
- Ordem de execucao: primeira story da trilha PC-03.

## 12. Riscos residuais
| Risco | Severidade | Mitigacao | Owner |
|---|---|---|---|
| Falha simultanea dos canais de alerta | critico | redundancia + fallback + ticket automatico | Superadmin + DevOps |

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
