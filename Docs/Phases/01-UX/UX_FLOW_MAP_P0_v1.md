# UX Flow Map P0 v1

## 1. Metadados
- Projeto: KoraOS MVP
- Fase: 01-UX
- Data: 2026-02-09
- Autor: Codex + PO
- Base canonica:
  - `Docs/PRD/12_prd_koraos_mvp_v1.0.md`
  - `Docs/PRD/13_prd_review_blindspots_v1.3.md`
  - `Docs/PRD/HANDOFF_2026-02-08_CANONICAL_NEXT_PHASE.md`

## 2. Objetivo
Definir fluxos UX P0 ponta a ponta para operacao de clinica, incluindo estados normais e excecoes criticas:
- human takeover
- contingencia WhatsApp com replay
- modo seguro por alerta sem ACK em 15 min

Saida esperada:
- mapa de fluxo validado para handoff da Fase 02-Architecture.

## 3. Escopo P0 desta versao
Incluido:
1. Entrada de mensagem e triagem inicial.
2. Qualificacao e conversao em agendamento.
3. Confirmacao D-1 com regras de escalonamento manual.
4. Escalonamento humano (takeover) e retorno para IA.
5. Modo contingencia/replay.
6. Modo seguro por falta de ACK de alerta critico.

Fora de escopo desta versao:
1. Wireframe visual de alta fidelidade.
2. Design system final.
3. Fluxos P1/P2.

## 4. Contexto congelado aplicado ao UX
1. Throughput por clinica: 1.000 msg/dia, pico 18 msg/min.
2. Prioridade de fila:
   - urgencia/takeover
   - confirmacao/reagendamento
   - novos leads
   - follow-up
3. SLA humano:
   - comercial <= 15 min
   - after-hours urgente nao aplicavel
   - nao urgente <= 30 min apos inicio do proximo turno
4. D-1:
   - disparos IA periodicos 09:00-12:00
   - pendente 16:00 vira tarefa manual
   - pendente 17:00 notifica secretaria + gestor
   - persistindo no dia seguinte, notificar 30 min antes da abertura
5. Guardians:
   - deny-by-default
   - permissao explicita do responsavel primario
6. Contingencia WhatsApp:
   - runbook + fila de contingencia + replay
7. Alertas tecnicos criticos:
   - owner: superadmin
   - reenvio WhatsApp a cada 5 min por 30 min
   - ACK obrigatorio
   - sem ACK em 15 min: modo seguro
8. Dashboard gestor:
   - foco em 4 KPIs principais + 6 secundarios
   - sem foco em infra tecnica detalhada

## 5. Perfis e superficies UX P0
Perfis:
1. Secretaria
2. Gestor
3. Superadmin

Telas/superficies P0:
1. Conversas (tempo real + takeover manual)
2. Pipeline (kanban com auditoria)
3. Agenda (dia/semana/mes)
4. Inbox de tarefas operacionais (D-1/manual)
5. Painel de incidentes/contingencia (superadmin e gestor)

## 6. Mapa de estados globais
Estados de conversa (alto nivel):
1. `active_ai`
2. `awaiting_explicit_confirmation`
3. `takeover_active`
4. `contingency_queueing`
5. `safe_mode_restricted`
6. `closed`

Estados de ticket takeover:
1. `open`
2. `in_progress`
3. `sla_warning`
4. `sla_breached`
5. `resolved`

Estados de acao sensivel:
1. `requested`
2. `pending_guardian_authorization`
3. `confirmed_explicitly`
4. `blocked`
5. `committed`

## 7. Fluxos P0 (detalhados)

### F-01 Entrada e triagem de mensagem
Trigger:
- nova mensagem WhatsApp (texto/audio/imagem/pdf).

Fluxo principal:
1. sistema registra ACK tecnico e enqueue.
2. conversa entra em `active_ai`.
3. IA classifica intencao inicial (lead novo, reagendamento, confirmacao, takeover).
4. UX da tela Conversas exibe badge de prioridade da fila.
5. se precisar side-effect, conversa muda para `awaiting_explicit_confirmation`.

Excecoes:
1. media invalida/expirada: exibir fallback seguro e manter conversa ativa.
2. evento duplicado: nao duplicar item de conversa nem acao.
3. falha de IA: abrir ticket de erro sistemico e oferecer continuidade operacional.

Evidencias esperadas para arquitetura:
1. contrato de ordenacao por `contact_id`.
2. dedupe por `external_id`.
3. correlation id para trilha ponta a ponta.

### F-02 Qualificacao -> agendamento
Trigger:
- intencao de agendar/reagendar/cancelar detectada.

Fluxo principal:
1. IA coleta contexto de contato e guardians.
2. sistema valida permissao (deny-by-default para sensivel).
3. IA oferece opcoes validas de horario.
4. usuario confirma explicitamente.
5. sistema executa operacao com idempotencia e audita.
6. UX atualiza Pipeline e Agenda em tempo real.

Excecoes:
1. confirmacao ambigua: bloquear side-effect e pedir reconfirmacao.
2. permissao guardian ausente: bloquear e orientar fluxo seguro.
3. conflito de agenda: exibir alternativas validas.

Pontos de UX obrigatorios:
1. copy explicita para confirmacao final.
2. indicacao visual de bloqueio por permissao.
3. historico de motivo em caso de bloqueio.

### F-03 Confirmacao D-1 e escalonamento manual
Trigger:
- rotina D-1 para appointments elegiveis.

Fluxo principal:
1. IA dispara confirmacoes entre 09:00 e 12:00.
2. pendente as 16:00 vira tarefa manual na Inbox.
3. pendente as 17:00 gera alerta para secretaria e gestor.
4. persistindo ate dia seguinte: notificar 30 min antes da abertura.

Excecoes:
1. conversa ativa no momento: pausar follow-up de conflito.
2. resposta com ambiguidade: manter em pendente com proxima acao clara.
3. baixa capacidade operacional: priorizar por risco de no-show.

UX obrigatorio:
1. contadores de pendentes por janela.
2. fila de tarefas manuais com ordenacao por risco.
3. CTA unico por tarefa (confirmar, ligar, remarcar, escalar).

### F-04 Human takeover e retorno controlado
Trigger:
- pedido explicito de humano, frustracao, incompreensao recorrente, ou acionamento manual.

Fluxo principal:
1. criar ticket com contexto (contact, lead, conversa, prioridade).
2. marcar conversa como `takeover_active`.
3. silenciar respostas IA enquanto takeover ativo.
4. acompanhar SLA por niveis e alertas.
5. operador encerra takeover com motivo.
6. conversa volta para `active_ai` com contexto pos-takeover.

Excecoes:
1. SLA proximo de vencer: alerta visual forte para responsavel.
2. SLA estourado: escalonamento automatico de nivel.
3. retorno indevido para IA sem resolucao: bloquear e exigir motivo.

UX obrigatorio:
1. banner persistente "IA silenciada por takeover".
2. relogio de SLA visivel no card/ticket.
3. trilha de auditoria de inicio, mudancas de nivel e encerramento.

### F-05 Contingencia WhatsApp + replay
Trigger:
- indisponibilidade do canal principal ou degradacao critica.

Fluxo principal:
1. acionar modo `contingency_queueing`.
2. manter captura operacional com fila de contingencia.
3. exibir status de contingencia para operacao.
4. apos normalizacao, iniciar replay controlado.
5. revalidar contexto antes de side-effects.

Excecoes:
1. item expirado para replay: converter para tarefa manual.
2. backlog alto no replay: aplicar prioridade e controle de vazao.
3. conflito com estado atual da conversa: abortar commit e registrar motivo.

UX obrigatorio:
1. selo de origem da mensagem (`normal` ou `contingencia/replay`).
2. aviso de "mensagem reprocessada" quando aplicavel.
3. fila de excecoes para tratamento manual.

### F-06 Modo seguro por alerta sem ACK
Trigger:
- alerta tecnico critico sem ACK em 15 min.

Fluxo principal:
1. sistema reenvia alerta ao superadmin a cada 5 min por 30 min.
2. sem ACK no prazo, entrar em `safe_mode_restricted`.
3. bloquear side-effects (`agendar`, `reagendar`, `cancelar`).
4. manter ingestao normal e enfileirar pendencias.
5. enviar mensagem padrao de contingencia ao usuario final.
6. abrir ticket critico para acao no proximo turno.

Saida do modo seguro:
1. exige ACK registrado do superadmin.
2. exige acao auditavel de retomada.

UX obrigatorio:
1. banner global de modo seguro nas telas operacionais.
2. botoes sensiveis desabilitados com motivo explicito.
3. fila "pendencias bloqueadas por modo seguro".

## 8. Matriz fluxo -> telas -> perfil
| Fluxo | Conversas | Pipeline | Agenda | Inbox tarefas | Incidentes | Secretaria | Gestor | Superadmin |
|---|---|---|---|---|---|---|---|---|
| F-01 Entrada e triagem | X |  |  |  |  | X | X | X |
| F-02 Qualificacao -> agendamento | X | X | X |  |  | X | X |  |
| F-03 Confirmacao D-1 | X |  | X | X |  | X | X |  |
| F-04 Takeover | X | X |  | X | X | X | X | X |
| F-05 Contingencia + replay | X |  |  | X | X | X | X | X |
| F-06 Modo seguro sem ACK | X | X | X | X | X | X | X | X |

## 9. Regras UX transversais (obrigatorias)
1. Toda acao sensivel deve exibir estado e motivo de bloqueio quando aplicavel.
2. Toda transicao critica deve ser rastreavel na timeline (quem, quando, por que).
3. Toda fila deve exibir prioridade e idade do item.
4. Tela nao pode esconder estado de modo seguro ou takeover ativo.
5. Copy de contingencia deve ser padronizada e sem linguagem tecnica.

## 10. Dados minimos para wireframes (proxima iteracao)
1. Conversa:
   - prioridade da fila
   - estado de conversa
   - estado takeover
   - bloqueio por permissao/confirmacao
2. Kanban:
   - estado lead
   - alertas de aging/SLA
3. Agenda:
   - disponibilidade validada
   - bloqueio por conflito
4. Inbox:
   - pendencias D-1
   - replay pendente
   - itens bloqueados em modo seguro
5. Incidentes:
   - alerta sem ACK
   - tempo para fail-safe
   - ticket critico aberto

## 11. Critérios de pronto da Fase 01-UX
1. Fluxos F-01..F-06 revisados e aceitos por PO.
2. Excecoes normativas refletidas em todas as telas impactadas.
3. Lista de componentes de interface para wireframe definida.
4. Handoff versionado para Architecture criado.

## 12. Pendencias para Fase 02-Architecture
1. Definir contrato tecnico de ordenacao causal vs prioridade de fila.
2. Definir fences de replay (TTL por intent + revalidacao de versao).
3. Definir estados tecnicos de modo seguro e criterio de retorno.
4. Definir eventos/auditoria minimos por fluxo para observabilidade.

## 13. Proximo artefato recomendado
- `Docs/Phases/01-UX/UX_WIREFRAME_SPEC_P0_v1.md`
