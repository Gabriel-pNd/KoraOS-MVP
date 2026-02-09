# PRD - KoraOS MVP v1.0
## Product Requirements Document com Épicos e Stories Priorizados

**Produto**: KoraOS MVP  
**Versão do documento**: 1.5 (mitigação mínima de alerta crítico + round 5)  
**Data**: 2026-02-09  
**Responsável**: PM (Morgan)  
**Fonte de referência**: `Docs/Brainstorming/08_project_brief_v3.1_MASTER.md`, `Docs/Brainstorming/11_blind_spots_v3_consolidated.md`, anexos `08a`, `08b`, `08c`, `08d`

---

## 1. Resumo Executivo

O KoraOS MVP é uma infraestrutura vertical de IA para clínicas multidisciplinares de neurodesenvolvimento (TEA/TDAH/atraso), com foco em três ganhos operacionais imediatos:

1. **Recuperar e converter leads** com atendimento WhatsApp 24/7 via Lívia.
2. **Reduzir caos operacional de agenda** com agendamento inteligente e regras de conflito.
3. **Aumentar previsibilidade e governança** com pipeline auditável, multitenancy seguro e escalonamento humano.

Este PRD define o escopo de MVP beta (12 semanas), prioridades de entrega, critérios de aceite e backlog detalhado em épicos/stories para execução de engenharia sem lacunas críticas.

---

## 2. Problema de Negócio e Oportunidade

### 2.1 Problemas críticos atuais (mercado-alvo)
- Atendimento frio e ineficaz no WhatsApp, com perda de leads fora do horário comercial.
- Operação manual da recepção com alto volume de mensagens e risco de erro.
- Agendamento complexo para múltiplos terapeutas/irmãos, gerando atrito e no-show.
- Falta de rastreabilidade operacional (quem fez o quê, quando e por quê).
- Risco de incidentes LGPD e vazamento cross-tenant em arquitetura mal isolada.

### 2.2 Oportunidade para o MVP
- Entregar ganho de receita e redução de carga operacional em até 90 dias.
- Criar base tecnológica segura (RLS + audit + fila resiliente) para escalar para múltiplas clínicas.
- Validar product-market fit com 3 clínicas piloto (beta white-glove).

---

## 3. Objetivos, Metas e KPIs

## 3.1 Objetivos de produto (MVP)
1. Garantir atendimento inicial em até 60 segundos para novos contatos.
2. Estruturar pipeline comercial rastreável do lead ao convertido.
3. Reduzir falhas operacionais de agenda (overbooking, agendamento sem confirmação, no-show sem lembrete).
4. Assegurar isolamento de tenant e trilha de auditoria em 100% das ações críticas.

## 3.2 KPIs de sucesso (meta beta)

| KPI | Meta MVP Beta | Janela |
|---|---:|---|
| Tempo de primeira resposta (WhatsApp) | <= 60s em 95% dos novos contatos | Semana 12 |
| Conversão Lead -> Agendado | +20% vs baseline da clínica | 60 dias pós go-live |
| Taxa de no-show | -30% vs baseline da clínica | 60 dias pós go-live |
| Perda de mensagem na entrada | 0 incidentes confirmados | Contínuo |
| Incidente de vazamento cross-tenant | 0 | Contínuo |
| Agendamento sem confirmação explícita | 0 | Contínuo |
| Tempo de escalonamento humano urgente | <= 15 min (SLA) | Beta |
| Disponibilidade da API de operação | >= 99.5% | Beta |

---

## 4. Escopo do MVP

## 4.1 Em escopo (MVP)
- Atendimento IA via WhatsApp (texto, áudio transcrito, imagem/PDF com ingestão).
- Pipeline comercial com Kanban, follow-up automatizado e auditoria.
- Agenda com criação/reagendamento/cancelamento e validações anti-conflito.
- Gestão de terapeutas, exceções, horários da clínica e feriados.
- Escalonamento para humano com tickets e SLA de takeover.
- Multi-tenant com RLS desde o dia 1.
- Painel operacional (secretária/gestor) + painel superadmin essencial.
- Prompt versioning, monitoramento, logs sanitizados e readiness de beta.

## 4.2 Fora de escopo (MVP)
- App mobile nativo.
- Portal dos pais 2.0.
- Auditoria de glosas automatizada (post-MVP).
- Migração self-service de dados (onboarding será white-glove manual).
- Otimização avançada de preço e billing automatizado.

---

## 5. Personas e JTBD

| Persona | Contexto | JTBD principal | Resultado esperado |
|---|---|---|---|
| Secretária | Alta carga de WhatsApp e agenda | "Quando chega mensagem, quero saber o próximo passo sem me perder." | Menos retrabalho e menos caos |
| Gestor de clínica | Pressão por conversão e eficiência | "Quero visibilidade do funil e da operação para tomar decisão rápida." | Mais previsibilidade de receita |
| Super Admin KoraOS | Opera múltiplos tenants | "Quero garantir segurança, estabilidade e governança de todas as clínicas." | Escala com risco controlado |
| Família/Responsável (usuário final indireto) | Ansiedade + urgência | "Quero resposta rápida e agendamento confiável sem fricção." | Confiança e continuidade |

---

## 6. Premissas e Restrições

- Stack definida: Next.js + NestJS + Supabase + N8N + Uazapi + OpenAI.
- Arquitetura **contact-centric** (`1 telefone = 1 contact`) com exceção formal via `patient_guardians`.
- N8N não acessa tabelas base diretamente; passa por API/Views isoladas.
- Todos os horários persistidos em UTC e exibidos por timezone do tenant.
- Qualquer ação sensível precisa de rastreabilidade (`audit_log`) e, quando aplicável, validação por senha.

---

## 7. Requisitos Funcionais (alto nível)

### 7.1 Atendimento e Conversa
- RF-001: Receber mensagens WhatsApp e responder com ACK imediato sem perda.
- RF-002: Processar texto, áudio, imagem e PDF com fallback seguro.
- RF-003: Lívia deve usar contexto histórico e evitar perguntas repetidas.
- RF-004: Ações com side-effect exigem confirmação explícita do contato.

### 7.2 CRM/Pipeline
- RF-005: Gerenciar leads com máquina de estados definida.
- RF-006: Operar Kanban com trilha de auditoria e bloqueios para ações manuais.
- RF-007: Executar follow-up escalonado com regras de pausa/cancelamento.

### 7.3 Agenda
- RF-008: Consultar disponibilidade com preferência logística (irmãos).
- RF-009: Criar/reagendar/cancelar com idempotência e validação de conflitos.
- RF-010: Impedir overbooking por constraint de banco e validação de aplicação.
- RF-011: Rodar confirmação D-1 e atualização de status.

### 7.4 Operação e Governança
- RF-012: Escalar para humano com tickets, SLA e devolução controlada para IA.
- RF-013: Disponibilizar telas por perfil (secretária, gestor, superadmin).
- RF-014: Garantir isolamento multi-tenant e compliance LGPD.
- RF-015: Versionar prompt e permitir deploy/rollback auditável.

---

## 8. Requisitos Não Funcionais

- RNF-001 Segurança: RLS ativo em tabelas multi-tenant; zero acesso cross-tenant fora de papel superadmin.
- RNF-002 Privacidade: sanitização obrigatória de PII em logs e retenção agressiva de payload sensível.
- RNF-003 Confiabilidade: fila persistente com dedupe, retries e dead-letter.
- RNF-004 Performance: ACK de webhook <= 2s; operações de UI p95 <= 500ms (consultas principais).
- RNF-005 Observabilidade: métricas, logs estruturados, auditoria de ações críticas.
- RNF-006 Resiliência: fallback em falha de IA e continuidade operacional com takeover humano.
- RNF-007 Integridade: idempotência para ações críticas de agendamento e dedupe de webhook.
- RNF-008 Governança: prompt versionado com rollback e trilha de implantação.

---

## 9. Estratégia de Priorização

### 9.1 Critérios de priorização

Cada item foi priorizado com base em:
1. **Risco regulatório/segurança** (LGPD, vazamento, auditoria).
2. **Impacto direto em receita/operação** (conversão, no-show, throughput da recepção).
3. **Dependências estruturais** (itens desbloqueadores para outros fluxos).
4. **Risco de regressão operacional** (blind spots já identificados).

### 9.2 Classificação
- **P0**: obrigatório para beta em produção.
- **P1**: importante para estabilidade/escala imediata pós-beta.
- **P2**: melhoria pós-estabilização.

---

## 10. Roadmap de Entrega (12 semanas)

| Fase | Semanas | Objetivo | Gate de saída |
|---|---|---|---|
| Fase 1 - Foundations | 1-2 | Auth, RLS, entidades base, segurança mínima | Isolamento tenant validado |
| Fase 2 - Pipeline Core | 3-4 | CRM, Kanban, trilha de auditoria | Lead lifecycle ponta a ponta |
| Fase 3 - Lívia Core | 5-6 | Orquestração principal + classificação multimodal | Conversa com tool-calling segura |
| Fase 4 - Scheduling | 7-8 | Agenda inteligente + anti-overbooking | Agendamento confiável com confirmação |
| Fase 5 - Engagement | 9-10 | Follow-up e lembretes | Automação sem colisões de contexto |
| Fase 6 - Polish + Beta | 11-12 | Painéis finais, QA, observabilidade, rollout | 3 clínicas em piloto assistido |

---

## 11. Backlog Priorizado por Épico e Stories

## EPIC-00 (P0): Fundação, Segurança e Compliance
**Objetivo**: Construir base multi-tenant segura, auditável e aderente à LGPD desde o primeiro deploy.  
**Dependências**: nenhuma (bloco inicial).  
**KPIs impactados**: vazamento cross-tenant, incidentes LGPD, disponibilidade operacional.

### KOS-EP00-US01 | P0 | Modelo de tenant + papéis base
**User Story**: Como superadmin, quero cadastrar tenants e perfis de usuário para separar operação por clínica.  
**Critérios de aceite**:
1. Sistema suporta papéis `secretary`, `manager`, `super_admin`, `system`.
2. Usuário comum só enxerga dados do próprio tenant.
3. Superadmin tem visão global auditável.  
**Blind spots cobertos**: #2  
**Fase**: 1

### KOS-EP00-US02 | P0 | RLS com variável de sessão
**User Story**: Como plataforma, quero enforcement de `tenant_id` no banco para impedir vazamento de dados.  
**Critérios de aceite**:
1. Funções `set_current_tenant` e `get_current_tenant` aplicadas.
2. Políticas RLS ativas nas tabelas com `tenant_id`.
3. Teste negativo comprova bloqueio de leitura cross-tenant.  
**Blind spots cobertos**: #2  
**Fase**: 1

### KOS-EP00-US03 | P0 | Middleware de tenant no NestJS
**User Story**: Como backend, quero setar tenant por request para que toda query use contexto correto.  
**Critérios de aceite**:
1. Header `x-tenant-id` ou `req.user.tenant_id` obrigatório para endpoints tenant-scoped.
2. Requisição sem tenant retorna `403`.
3. Middleware invoca `set_current_tenant` antes das operações de dados.  
**Blind spots cobertos**: #2  
**Fase**: 1

### KOS-EP00-US04 | P0 | Sanitização de PII em logs e audit
**User Story**: Como DPO/gestor, quero que dados sensíveis não apareçam em logs para reduzir risco LGPD.  
**Critérios de aceite**:
1. Campos sensíveis são redacted em logs estruturados.
2. `audit_log` persiste mudanças sanitizadas.
3. Payload de fila processada sofre minimização após 24h e purge após 7 dias.  
**Blind spots cobertos**: #3  
**Fase**: 1

### KOS-EP00-US05 | P0 | Consentimento LGPD operacional
**User Story**: Como clínica, quero registrar base legal de uso de dados no fluxo real de atendimento.  
**Critérios de aceite**:
1. Upload de mídia sensível registra consentimento implícito por ação.
2. Metadados de consentimento ficam auditáveis.
3. Fluxo alternativo de explicação LGPD existe para questionamento explícito do cliente.  
**Blind spots cobertos**: #3  
**Fase**: 1

### KOS-EP00-US06 | P0 | Soft delete + lixeira 30 dias
**User Story**: Como secretária/gestor, quero recuperar registros deletados acidentalmente sem perder histórico.  
**Critérios de aceite**:
1. Entidades críticas usam `deleted_at`/`deleted_by`.
2. Itens podem ser restaurados dentro de 30 dias por perfil autorizado.
3. Restauração e exclusão ficam em `audit_log`.  
**Blind spots cobertos**: #16  
**Fase**: 2

### KOS-EP00-US07 | P1 | Timezone por tenant
**User Story**: Como clínica em diferentes fusos, quero horários corretos em agenda e automações.  
**Critérios de aceite**:
1. Campo `timezone` por tenant configurável.
2. Datas persistidas em UTC; UI converte para timezone local.
3. Jobs de lembrete respeitam timezone do tenant.  
**Blind spots cobertos**: #15  
**Fase**: 5

---

## EPIC-01 (P0): Ingestão WhatsApp e Orquestração Resiliente
**Objetivo**: Garantir entrada confiável de mensagens e processamento robusto em escala.  
**Dependências**: EPIC-00.  
**KPIs impactados**: perda de mensagem, estabilidade do fluxo base, tempo de resposta.

### KOS-EP01-US01 | P0 | Webhook com ACK imediato
**User Story**: Como sistema, quero confirmar recebimento ao provedor rapidamente para evitar reenvios e perdas.  
**Critérios de aceite**:
1. Endpoint de webhook retorna 200 após `enqueue` persistente.
2. Tempo de ACK p95 <= 2s.
3. Mensagem não processada permanece com status `pending`.  
**Blind spots cobertos**: #4  
**Fase**: 3

### KOS-EP01-US02 | P0 | Dedupe de webhook por external_id
**User Story**: Como plataforma, quero ignorar eventos duplicados para evitar processamento duplo.  
**Critérios de aceite**:
1. Índice único por (`tenant_id`, `external_id`) para itens não dead-letter.
2. Segundo evento duplicado não dispara novo processamento.
3. Métrica de dedupe disponível para monitoramento.  
**Blind spots cobertos**: #13  
**Fase**: 3

### KOS-EP01-US03 | P0 | Limite de fila + dead-letter
**User Story**: Como superadmin, quero limitar fila por tenant para evitar degradação sistêmica.  
**Critérios de aceite**:
1. Tenant possui `max_queue_size` e `queue_alert_threshold`.
2. Overflow redireciona item para `dead_letter`.
3. Alertas são enviados para gestor/superadmin ao cruzar thresholds.  
**Blind spots cobertos**: #19  
**Fase**: 3

### KOS-EP01-US04 | P0 | Debounce e concatenação de mensagens
**User Story**: Como IA, quero consolidar mensagens fragmentadas para reduzir erros de interpretação.  
**Critérios de aceite**:
1. Janela de espera de 20s antes de inferência.
2. Mensagens recentes são concatenadas em contexto único.
3. Histórico persiste ordem temporal correta.  
**Blind spots cobertos**: #4, #14  
**Fase**: 3

### KOS-EP01-US05 | P0 | Ingestão de mídia com validação de Content-Type
**User Story**: Como IA, quero baixar e armazenar mídia de forma eager para evitar URL expirada/alucinação.  
**Critérios de aceite**:
1. Mídia é baixada antes de qualquer inferência.
2. Resposta `text/html` retorna fallback `MEDIA_EXPIRED` sem chamar LLM.
3. Arquivos válidos vão para storage com metadados de tamanho e tipo.  
**Blind spots cobertos**: #11  
**Fase**: 3

### KOS-EP01-US06 | P1 | Revogação/remoção de mensagem
**User Story**: Como plataforma, quero tratar mensagens removidas pelo usuário para preservar consistência do contexto.  
**Critérios de aceite**:
1. Webhook de revogação localiza mensagem por ID externo.
2. Conteúdo é substituído por marcador de mensagem removida e campos sensíveis são limpos.
3. Cache de contexto da conversa é invalidado.  
**Blind spots cobertos**: #10  
**Fase**: 6

### KOS-EP01-US07 | P1 | Limpeza programada da fila
**User Story**: Como plataforma, quero reduzir retenção de payload sensível após processamento.  
**Critérios de aceite**:
1. Job diário sanitiza payload processado após 24h.
2. Job remove itens processados após 7 dias.
3. Execução do cron é auditável e monitorável.  
**Blind spots cobertos**: #3  
**Fase**: 6

---

## EPIC-02 (P0): Lívia IA Conversacional com Guardrails
**Objetivo**: Operar atendimento natural 24/7 com segurança transacional e escalonamento humano.  
**Dependências**: EPIC-00, EPIC-01.  
**KPIs impactados**: tempo de resposta, conversão, incidentes de ação indevida.

### KOS-EP02-US01 | P0 | System prompt operacional v1
**User Story**: Como produto, quero regras duras de comportamento para evitar respostas robóticas e ações indevidas.  
**Critérios de aceite**:
1. Prompt inclui regras de confirmação explícita e escalonamento.
2. Prompt bloqueia side-effects com respostas ambíguas.
3. Prompt proíbe referência a mensagens revogadas.  
**Blind spots cobertos**: #10, #18  
**Fase**: 3

### KOS-EP02-US02 | P0 | Context loader completo
**User Story**: Como Lívia, quero receber contexto de contato, pacientes, guardians e histórico para evitar retrabalho.  
**Critérios de aceite**:
1. Contexto inclui `patients_as_primary` e `patients_as_guardian`.
2. Histórico de conversa retorna últimas 20 mensagens relevantes.
3. IA não repete pergunta quando dado já existe em contexto.  
**Blind spots cobertos**: #1  
**Fase**: 3

### KOS-EP02-US03 | P0 | Ferramentas de ação da Lívia
**User Story**: Como IA, quero tools para consultar/agendar/reagendar/cancelar/escalar com contrato validado.  
**Critérios de aceite**:
1. Ferramentas disponíveis via camada segura no backend.
2. Cada tool valida payload mínimo e permissões.
3. Erros de tool retornam fallback explicável ao cliente.  
**Blind spots cobertos**: #6, #17  
**Fase**: 3-4

### KOS-EP02-US04 | P0 | Confirmação explícita obrigatória
**User Story**: Como clínica, quero impedir agendamento/cancelamento sem confirmação inequívoca.  
**Critérios de aceite**:
1. Apenas `CONFIRMAR`, `CONFIRMADO` ou `CONFIRMA` habilitam side-effect.
2. Respostas curtas/ambíguas geram reconfirmação obrigatória.
3. Backend rejeita DTO sem `confirmed_by_contact=true`.  
**Blind spots cobertos**: #18, #6  
**Fase**: 4

### KOS-EP02-US05 | P0 | Guard de stale tool-call por versão
**User Story**: Como sistema, quero abortar ação se a conversa mudou entre decisão e execução.  
**Critérios de aceite**:
1. `version_at_start` armazenada antes de inferência.
2. Nova mensagem incrementa `conversations.version`.
3. Tool aborta com motivo auditável se versão divergir.  
**Blind spots cobertos**: #4  
**Fase**: 4

### KOS-EP02-US06 | P0 | Escalonamento inteligente para humano
**User Story**: Como cliente, quero ser atendido por humano em frustração ou pedido explícito.  
**Critérios de aceite**:
1. Frustração, incompreensão recorrente e pedido explícito acionam escalonamento.
2. Sistema cria ticket com contexto e prioridade.
3. Conversa fica silenciada para IA enquanto takeover estiver ativo.  
**Blind spots cobertos**: #9  
**Fase**: 5

### KOS-EP02-US07 | P1 | Fallback de falha de IA
**User Story**: Como operação, quero fallback quando OpenAI falhar para não deixar cliente sem resposta.  
**Critérios de aceite**:
1. Falha cria ticket de erro sistêmico.
2. Se clínica fechada, envia mensagem padrão de instabilidade.
3. Se clínica aberta, direciona para fluxo humano interno.  
**Blind spots cobertos**: #2 (AI failure do anexo C)  
**Fase**: 6

---

## EPIC-03 (P0): CRM e Pipeline Comercial Auditável
**Objetivo**: Garantir fluxo comercial rastreável do novo lead até conversão/perda.  
**Dependências**: EPIC-00.  
**KPIs impactados**: conversão, lead aging, governança operacional.

### KOS-EP03-US01 | P0 | Máquina de estados de lead
**User Story**: Como gestor, quero estados padronizados para prever funil e gargalos.  
**Critérios de aceite**:
1. Estados definidos: novo, em_qualificacao, qualificado, agendado, confirmado, sucesso, convertido, follow_up, perdido, unreachable.
2. Transições inválidas são bloqueadas.
3. Mudanças de status atualizam `status_changed_at`.  
**Blind spots cobertos**: #8  
**Fase**: 2

### KOS-EP03-US02 | P0 | Kanban com movimento manual controlado
**User Story**: Como secretária, quero mover card manualmente com justificativa quando necessário.  
**Critérios de aceite**:
1. Movimento manual exige senha do usuário e motivo.
2. `audit_log` grava before/after com marcador `manual=true`.
3. Senha inválida bloqueia alteração.  
**Blind spots cobertos**: #11 (anexo C), #3  
**Fase**: 2

### KOS-EP03-US03 | P0 | Find-or-create com reativação de lead
**User Story**: Como sistema, quero reaproveitar lead deletado para evitar lead zumbi duplicado.  
**Critérios de aceite**:
1. Busca inclui soft-deleted (`withDeleted`).
2. Lead deletado é reativado com contagem de reativação.
3. Criação só ocorre se realmente não existir matching lógico.  
**Blind spots cobertos**: #16  
**Fase**: 2

### KOS-EP03-US04 | P0 | Conversão lead->patient com cancelamento de follow-up
**User Story**: Como operação, quero encerrar follow-ups pendentes após conversão para evitar mensagem indevida.  
**Critérios de aceite**:
1. Ao preencher `converted_to_patient_id`, status vira `convertido`.
2. `next_followup_at` é limpo automaticamente.
3. Evento é registrado em auditoria.  
**Blind spots cobertos**: #8  
**Fase**: 5

### KOS-EP03-US05 | P1 | Timeline unificada de eventos
**User Story**: Como gestor, quero histórico completo de interações e mudanças para investigação rápida.  
**Critérios de aceite**:
1. Timeline agrega mensagens, status changes, agendamentos e tickets.
2. Cada evento exibe usuário/origem (`ia`, `secretary`, `system`).
3. Filtros por período e tipo funcionam por tenant.  
**Blind spots cobertos**: #3  
**Fase**: 6

### KOS-EP03-US06 | P1 | Tratamento de lead unreachable
**User Story**: Como secretária, quero ser avisada quando número estiver bloqueado/inválido para agir manualmente.  
**Critérios de aceite**:
1. Erro de envio mapeia `BLOCKED`/`INVALID_NUMBER` para `unreachable`.
2. Ticket de baixa prioridade é criado para acompanhamento.
3. Fluxos automáticos deixam de tentar contato até ação humana.  
**Blind spots cobertos**: #8 (anexo C item números bloqueados)  
**Fase**: 6

---

## EPIC-04 (P0): Agendamento Inteligente e Agenda Operacional
**Objetivo**: Tornar agendamento confiável, legível e livre de conflitos críticos.  
**Dependências**: EPIC-00, EPIC-03.  
**KPIs impactados**: no-show, overbooking, conversão para consulta.

### KOS-EP04-US01 | P0 | Cadastro de terapeutas e disponibilidade
**User Story**: Como gestor, quero manter disponibilidade semanal de terapeutas para alimentar motor de agenda.  
**Critérios de aceite**:
1. Terapeuta possui especialidades e slots de disponibilidade.
2. Exceções por data (folga/férias/congresso) são suportadas.
3. Agenda só oferece horários válidos conforme disponibilidade efetiva.  
**Blind spots cobertos**: #10 (transferência terapeuta prepara base)  
**Fase**: 4

### KOS-EP04-US02 | P0 | Horário de clínica e feriados
**User Story**: Como operação, quero bloquear agendamentos em períodos não operacionais.  
**Critérios de aceite**:
1. `clinic_hours` por dia da semana obrigatório para tenant.
2. Feriados nacionais + locais + custom influenciam disponibilidade.
3. Consultas fora da janela retornam motivo de bloqueio explicável.  
**Blind spots cobertos**: #9 (anexo C), #15  
**Fase**: 4-5

### KOS-EP04-US03 | P0 | Consulta de disponibilidade com logística para irmãos
**User Story**: Como família, quero opções de horário otimizadas para múltiplos filhos no mesmo dia.  
**Critérios de aceite**:
1. Opções retornam ranking `optimal`, `good`, `acceptable`.
2. Fluxo pergunta preferência `same_time` vs `sequential`.
3. Validação impede choque logístico do responsável.  
**Blind spots cobertos**: #5, #1  
**Fase**: 4

### KOS-EP04-US04 | P0 | Proteção contra overbooking
**User Story**: Como clínica, quero impedir conflitos de terapeuta no mesmo intervalo.  
**Critérios de aceite**:
1. Constraint `EXCLUDE` ativa na tabela de appointments.
2. API valida conflito antes de inserir lote.
3. Mensagem de erro devolve conflito específico para reoferta de horário.  
**Blind spots cobertos**: #6  
**Fase**: 4

### KOS-EP04-US05 | P0 | Idempotência de agendamento/reagendamento/cancelamento
**User Story**: Como backend, quero evitar execução duplicada em chamadas repetidas/retries.  
**Critérios de aceite**:
1. Header/chave de idempotência obrigatória para operações críticas.
2. Requisição duplicada retorna resposta consistente sem duplicar efeito.
3. TTL e invalidação da chave são configuráveis.  
**Blind spots cobertos**: #6, #13  
**Fase**: 4

### KOS-EP04-US06 | P0 | Two-phase commit de confirmação de agendamento
**User Story**: Como operação, quero evitar appointment órfão quando envio de confirmação falha.  
**Critérios de aceite**:
1. Novo agendamento nasce em `pending_confirmation`.
2. Envio confirmado promove para `scheduled`.
3. Falha registra erro, conta de retry e agenda nova tentativa automática.  
**Blind spots cobertos**: #7  
**Fase**: 4

### KOS-EP04-US07 | P1 | Verificador de órfãos por cron
**User Story**: Como plataforma, quero detectar pendências antigas para não bloquear agenda sem comunicação.  
**Critérios de aceite**:
1. Cron roda a cada 5 minutos.
2. Busca agendamentos pendentes com idade > 10 min e retries disponíveis.
3. Reencaminha para fila de retry e registra telemetria.  
**Blind spots cobertos**: #7  
**Fase**: 5

### KOS-EP04-US08 | P1 | Permissões de responsáveis secundários (guardians)
**User Story**: Como clínica, quero respeitar permissões granulares de cada responsável por paciente.  
**Critérios de aceite**:
1. `patient_guardians` define permissões `can_schedule`, `can_cancel`, etc.
2. Ação não autorizada gera bloqueio e ticket para validação humana.
3. Processo de verificação de vínculo registra método, data e aprovador.  
**Blind spots cobertos**: #1  
**Fase**: 6

---

## EPIC-05 (P0): Engajamento Automatizado (Follow-up e Lembretes)
**Objetivo**: Aumentar conversão e reduzir no-show sem colidir com conversas ativas.  
**Dependências**: EPIC-02, EPIC-03, EPIC-04.  
**KPIs impactados**: conversão de leads frios, no-show, taxa de resposta.

### KOS-EP05-US01 | P0 | Follow-up escalonado por estágio
**User Story**: Como operação, quero regras automáticas de reengajamento conforme tempo sem resposta.  
**Critérios de aceite**:
1. Estágios seguem cadência 24h, 72h, 7d, 30d, 60d, 90d+.
2. Processamento usa FIFO (`oldest first`).
3. Atualização de estágio e timestamps ocorre a cada disparo válido.  
**Blind spots cobertos**: #8  
**Fase**: 5

### KOS-EP05-US02 | P0 | Bloqueio de follow-up para lead convertido
**User Story**: Como cliente, não quero receber follow-up comercial após já estar convertido.  
**Critérios de aceite**:
1. Workflow verifica estado antes de enviar mensagem.
2. Se convertido, follow-ups pendentes são cancelados.
3. Evento fica auditado com razão `converted_to_patient`.  
**Blind spots cobertos**: #8  
**Fase**: 5

### KOS-EP05-US03 | P0 | Colisão follow-up vs conversa ativa
**User Story**: Como cliente, não quero receber mensagem automática enquanto estou conversando.  
**Critérios de aceite**:
1. Follow-up checa `last_message_at` antes de disparar.
2. Se atividade < 15 min, fluxo adia envio.
3. Reagendamento automático é registrado com motivo.  
**Blind spots cobertos**: #14  
**Fase**: 5

### KOS-EP05-US04 | P0 | Lembrete D-1 timezone-aware
**User Story**: Como clínica, quero confirmar sessões do dia seguinte para reduzir faltas.  
**Critérios de aceite**:
1. Job considera timezone do tenant e regras de sábado/domingo.
2. Lembrete não envia em feriado aplicável.
3. Mensagem inclui terapeuta e conselho profissional.  
**Blind spots cobertos**: #15, #7  
**Fase**: 5

### KOS-EP05-US05 | P0 | Rate-limit anti-ban por telefone
**User Story**: Como superadmin, quero limitar volume de envios para proteger o número da clínica.  
**Critérios de aceite**:
1. Máximo de 6 mensagens/hora por telefone por tenant.
2. Delay randômico entre envios aplicado automaticamente.
3. Excesso de envio resulta em skip controlado, sem erro fatal.  
**Blind spots cobertos**: #1 (anexo C rate limit)  
**Fase**: 5

### KOS-EP05-US06 | P1 | Tratamento de no-show e reconciliação de status
**User Story**: Como gestor, quero diferenciar no-show de sucesso para melhorar análise operacional.  
**Critérios de aceite**:
1. Appointment suporta `confirmed`, `no_show`, `completed`, `cancelled`.
2. Mudança de status atualiza lead/pipeline conforme regra.
3. Relatório operacional considera no-show por terapeuta e período.  
**Blind spots cobertos**: #7 (consistência de estado)  
**Fase**: 6

### KOS-EP05-US07 | P1 | Mensagem de follow-up contextual por IA
**User Story**: Como família, quero mensagens de reengajamento com contexto real da conversa anterior.  
**Critérios de aceite**:
1. Prompt de follow-up inclui resumo da última interação.
2. Mensagem gerada evita template genérico repetitivo.
3. Comprimento máximo e tom empático são respeitados.  
**Blind spots cobertos**: #20 (governança de prompt)  
**Fase**: 6

---

## EPIC-06 (P0): Escalonamento Humano e Ticketing
**Objetivo**: Garantir transição segura IA->humano->IA sem conversa abandonada.  
**Dependências**: EPIC-02, EPIC-03.  
**KPIs impactados**: SLA de atendimento humano, satisfação operacional.

### KOS-EP06-US01 | P0 | Ativação de human takeover
**User Story**: Como secretária/IA, quero pausar respostas automáticas quando conversa precisa de humano.  
**Critérios de aceite**:
1. Takeover pode ser ativado manualmente ou por gatilho da IA.
2. Enquanto takeover ativo, IA não envia respostas.
3. Motivo e autor da ativação ficam persistidos.  
**Blind spots cobertos**: #9  
**Fase**: 5

### KOS-EP06-US02 | P0 | Ticket com contexto operacional
**User Story**: Como recepção, quero ticket estruturado para tratar exceções sem perder contexto.  
**Critérios de aceite**:
1. Ticket vincula contact/lead/conversation e prioridade.
2. Razão e resumo da situação são obrigatórios.
3. Tela de operação lista tickets abertos por urgência.  
**Blind spots cobertos**: #9  
**Fase**: 5

### KOS-EP06-US03 | P0 | Deadline e escalonamento em níveis
**User Story**: Como gestor, quero escalonamento automático se takeover atrasar.  
**Critérios de aceite**:
1. Prazo inicial de 15 min (frustração) ou 60 min (demais motivos).
2. Escalonamento nível 1 (secretária), nível 2 (gestor), nível 3 (auto-reply + retorno IA).
3. Mudança de nível atualiza `human_takeover_deadline`.  
**Blind spots cobertos**: #9  
**Fase**: 5

### KOS-EP06-US04 | P1 | Notificações de SLA em tempo real
**User Story**: Como equipe, quero alertas de SLA vencendo para evitar cliente sem resposta.  
**Critérios de aceite**:
1. Alertas disparam em janelas pré-vencimento e pós-vencimento.
2. Canais mínimos: painel web + registro em auditoria.
3. Alertas são deduplicados para evitar spam interno.  
**Blind spots cobertos**: #9  
**Fase**: 6

### KOS-EP06-US05 | P1 | Retorno controlado para IA
**User Story**: Como operação, quero devolver conversa para IA após tratamento humano sem perder contexto.  
**Critérios de aceite**:
1. Operador pode encerrar takeover com motivo.
2. Contexto final humano é anexado no histórico.
3. Próxima mensagem da IA respeita estado pós-takeover.  
**Blind spots cobertos**: #9, #4  
**Fase**: 6

---

## EPIC-07 (P1): Experiência Web Operacional e SuperAdmin
**Objetivo**: Entregar interface de operação diária e governança global de tenants.  
**Dependências**: EPIC-03, EPIC-04, EPIC-06.  
**KPIs impactados**: produtividade da recepção, visibilidade de gestão, tempo de reação.

### KOS-EP07-US01 | P0 | Login e controle de sessão por perfil
**User Story**: Como usuário interno, quero autenticar com segurança e acessar apenas minhas permissões.  
**Critérios de aceite**:
1. Login, logout e recuperação de senha operacionais.
2. Menu e rotas mudam conforme papel.
3. Sessão inválida redireciona para autenticação.  
**Blind spots cobertos**: #2  
**Fase**: 1-2

### KOS-EP07-US02 | P0 | Tela Conversas (tempo real + takeover manual)
**User Story**: Como secretária, quero conversar com contatos e assumir atendimento quando necessário.  
**Critérios de aceite**:
1. Lista de conversas ordenada por recência.
2. Histórico de mensagens com marcadores de origem (`ia`/`humano`).
3. Botão de takeover manual disponível para perfil autorizado.  
**Blind spots cobertos**: #9, #10  
**Fase**: 3-5

### KOS-EP07-US03 | P0 | Tela Pipeline (Kanban)
**User Story**: Como recepção, quero mover e acompanhar leads visualmente por estágio.  
**Critérios de aceite**:
1. Colunas refletem estados oficiais do pipeline.
2. Drag and drop respeita regras de transição.
3. Movimento manual exige senha/motivo quando aplicável.  
**Blind spots cobertos**: #11 (anexo C)  
**Fase**: 2-3

### KOS-EP07-US04 | P0 | Tela Agenda (dia/semana/mês)
**User Story**: Como operação, quero visualizar agenda em diferentes granularidades para agir rápido.  
**Critérios de aceite**:
1. Visões dia, semana e mês disponíveis.
2. Modal de detalhes permite reagendar/cancelar com motivo.
3. Conflitos são sinalizados imediatamente na UI.  
**Blind spots cobertos**: #6, #7, #15  
**Fase**: 4-5

### KOS-EP07-US05 | P1 | Dashboard gestor com KPIs
**User Story**: Como gestor, quero acompanhar funil, performance e alertas estratégicos em uma tela.  
**Critérios de aceite**:
1. KPIs de lead, agendamento, confirmação e no-show exibidos.
2. Filtros por período e terapeuta.
3. Alertas críticos priorizados no topo.  
**Blind spots cobertos**: #19 (alertas operacionais)  
**Fase**: 6

### KOS-EP07-US06 | P1 | Configurações da clínica
**User Story**: Como gestor, quero ajustar horários, feriados e integrações sem depender de deploy.  
**Critérios de aceite**:
1. CRUD de `clinic_hours` e feriados custom.
2. Exibição do timezone atual e edição controlada.
3. Alterações relevantes geram auditoria.  
**Blind spots cobertos**: #15  
**Fase**: 6

### KOS-EP07-US07 | P1 | Superadmin: gestão de tenants e usuários globais
**User Story**: Como superadmin, quero ativar/pausar clínica e gerir usuários globais com segurança.  
**Critérios de aceite**:
1. CRUD de tenant com status ativo/pausado.
2. Criação/edição de usuário por tenant.
3. Ações globais registradas em auditoria global.  
**Blind spots cobertos**: #2  
**Fase**: 6

### KOS-EP07-US08 | P1 | Superadmin: monitoramento infra e auditoria global
**User Story**: Como superadmin, quero visão consolidada de saúde do ecossistema para resposta rápida.  
**Critérios de aceite**:
1. Status de integrações (N8N, Supabase, Uazapi) visível.
2. Alertas de fila/storage/tickets críticos por tenant.
3. Busca global em `audit_log` por entidade/ação/período.  
**Blind spots cobertos**: #3, #19  
**Fase**: 6

---

## EPIC-08 (P0): Operabilidade, PromptOps, QA e Go-Live Beta
**Objetivo**: Fechar ciclo de qualidade, observabilidade e operação para piloto real sem risco oculto.  
**Dependências**: Todos os épicos anteriores.  
**KPIs impactados**: disponibilidade, regressão, tempo de recuperação.

### KOS-EP08-US01 | P0 | Observabilidade unificada
**User Story**: Como engenharia/suporte, quero métricas e logs acionáveis para detectar incidentes cedo.  
**Critérios de aceite**:
1. Dashboards mínimos: ingestão, fila, latência API, erro por endpoint, taxa de fallback IA.
2. Logs estruturados com correlation id por mensagem/conversa.
3. Alertas para thresholds de erro e backlog.  
**Blind spots cobertos**: #19, #3  
**Fase**: 6

### KOS-EP08-US02 | P0 | Prompt versioning com deploy/rollback
**User Story**: Como superadmin, quero publicar e reverter prompt sem deploy de código.  
**Critérios de aceite**:
1. Tabela `prompt_versions` com versão ativa por nome.
2. Deploy de nova versão desativa anterior e salva `rollback_from`.
3. Rollback restaura versão anterior e audita ação.  
**Blind spots cobertos**: #20  
**Fase**: 6

### KOS-EP08-US03 | P0 | Testes E2E dos fluxos críticos
**User Story**: Como time de produto, quero validar jornada ponta a ponta antes de abrir beta.  
**Critérios de aceite**:
1. Cobertura mínima: novo lead -> qualificação -> agendamento -> lembrete -> confirmação.
2. Fluxos de exceção cobertos: takeover, mensagem revogada, media expirada.
3. Pipeline de CI bloqueia merge com falha crítica.  
**Blind spots cobertos**: #4, #7, #10, #11  
**Fase**: 6

### KOS-EP08-US04 | P0 | Testes de isolamento e segurança
**User Story**: Como compliance, quero comprovar que não há acesso indevido entre clínicas.  
**Critérios de aceite**:
1. Testes automatizados de RLS para operações CRUD críticas.
2. Testes negativos em rotas tenant-scoped sem header/claim válido.
3. Resultado documentado para aceite de go-live.  
**Blind spots cobertos**: #2, #3  
**Fase**: 6

### KOS-EP08-US05 | P0 | Testes de carga e concorrência
**User Story**: Como engenharia, quero validar comportamento sob pico para evitar degradação em produção.  
**Critérios de aceite**:
1. Cenário de pico em webhook + fila + processamento paralelo.
2. Sem perda de mensagem sob volume alvo do piloto.
3. Locks/idempotência evitam corridas de atualização e duplicidade.  
**Blind spots cobertos**: #17, #13, #19  
**Fase**: 6

### KOS-EP08-US06 | P1 | Runbook de incidentes e operação
**User Story**: Como suporte, quero playbooks claros para responder falhas rapidamente.  
**Critérios de aceite**:
1. Runbook para falha OpenAI, Uazapi, fila cheia e fallback manual.
2. Fluxo de escalonamento interno com donos por severidade.
3. Checklist de comunicação com clínica afetada.  
**Blind spots cobertos**: #19, #2 (AI failure), #9  
**Fase**: 6

### KOS-EP08-US07 | P1 | Onboarding white-glove para 3 clínicas
**User Story**: Como operação KoraOS, quero processo padronizado de implantação assistida para reduzir risco de adoção.  
**Critérios de aceite**:
1. Checklist de onboarding por tenant (dados, horários, terapeutas, integrações).
2. Janela de hiper-care de 14 dias com monitoramento dedicado.
3. Coleta de baseline e pós-go-live para KPIs principais.  
**Blind spots cobertos**: mitigação operacional geral  
**Fase**: 6

### KOS-EP08-US08 | P2 | Relatório executivo de ROI do beta
**User Story**: Como founder, quero relatório de resultado por clínica para validar pricing baseado em valor.  
**Critérios de aceite**:
1. Relatório traz baseline vs pós-implantação para conversão/no-show/tempo de resposta.
2. Evidências por tenant e consolidado global.
3. Exportável para tomada de decisão comercial.  
**Blind spots cobertos**: não aplicável (estratégico)  
**Fase**: pós-beta

---

## 12. Matriz de Cobertura dos Blind Spots Críticos

| Blind Spot | Coberto por Stories |
|---|---|
| #1 Guarda compartilhada | EP02-US02, EP04-US03, EP04-US08 |
| #2 Cross-tenant | EP00-US01, EP00-US02, EP00-US03, EP07-US01, EP08-US04 |
| #3 PII em logs/audit | EP00-US04, EP01-US07, EP07-US08, EP08-US01, EP08-US04 |
| #4 Tool-call stale | EP02-US05, EP01-US01, EP08-US03 |
| #6 Overbooking | EP04-US04, EP04-US05 |
| #7 Appointment órfão | EP04-US06, EP04-US07, EP05-US04 |
| #8 Lead zumbi/follow-up pós-conversão | EP03-US04, EP05-US01, EP05-US02 |
| #9 Human takeover deadlock | EP02-US06, EP06-US01, EP06-US02, EP06-US03, EP06-US05 |
| #10 Mensagem removida | EP01-US06, EP02-US01, EP07-US02, EP08-US03 |
| #11 URL de mídia expira | EP01-US05, EP08-US03 |
| #13 Webhook duplicado | EP01-US02, EP04-US05, EP08-US05 |
| #14 Follow-up vs conversa ativa | EP01-US04, EP05-US03 |
| #15 Timezone | EP00-US07, EP04-US02, EP05-US04, EP07-US04 |
| #16 Soft delete zumbi | EP00-US06, EP03-US03 |
| #17 Concorrência cross-workflow | EP02-US03, EP04-US05, EP08-US05 |
| #18 Ambiguidade semântica | EP02-US01, EP02-US04 |
| #19 Fila sem limite/dead-letter | EP01-US03, EP08-US01, EP08-US05 |
| #20 Prompt drift | EP05-US07, EP08-US02 |

---

## 13. Dependências Externas

- **OpenAI**: GPT-4o + Whisper disponíveis e estáveis.
- **Uazapi**: webhook e envio de mensagens com SLA aceitável.
- **Supabase**: banco PostgreSQL, RLS, storage e auth.
- **N8N self-hosted**: execução de workflows e cron jobs.
- **Canal humano da clínica**: equipe mínima para takeover nos horários acordados.

---

## 14. Riscos, Impacto e Mitigação

| Risco | Impacto | Mitigação |
|---|---|---|
| Quebra de isolamento tenant | Crítico (LGPD/comercial) | RLS + testes negativos + middleware obrigatório |
| Duplicidade/agendamento indevido | Alto | Idempotência + confirmação explícita + constraint de banco |
| Queda de integração (OpenAI/Uazapi) | Alto | Fallback, tickets, runbook de incidente |
| Saturação da fila | Alto | Limites por tenant, dead-letter, alertas |
| Drift de prompt com regressão | Médio/Alto | Versionamento de prompt + rollback + suíte de regressão |
| Adoção fraca na clínica piloto | Alto | Onboarding white-glove + hiper-care + treinamento |

---

## 15. Definition of Ready (DoR) e Definition of Done (DoD)

## 15.1 Definition of Ready (story)
- Critérios de aceite escritos e testáveis.
- Dependências técnicas mapeadas.
- Regras de autorização e auditoria definidas.
- Eventos/estados envolvidos documentados.

## 15.2 Definition of Done (story)
- Código revisado e testes automatizados passando.
- Logs estruturados + auditoria aplicados quando necessário.
- Métricas mínimas instrumentadas.
- Critérios de aceite validados em ambiente de staging.

---

## 16. Plano de Validação Beta (UAT)

### Cenários obrigatórios de aceite
1. Novo lead por WhatsApp à noite -> qualificação -> agendamento com `CONFIRMAR`.
2. Reagendamento com conflito de horário -> reoferta de opção válida.
3. Follow-up não dispara durante conversa ativa.
4. Escalação por frustração -> ticket -> SLA de resposta.
5. Mensagem duplicada de webhook não gera duplicidade de processamento.
6. Tentativa de acesso cross-tenant é bloqueada.

### Critério de entrada em produção beta
- 100% dos cenários críticos acima aprovados.
- Sem P0 aberto em segurança/agenda/fila.
- Onboarding das 3 clínicas piloto preparado.

---

## 17. Backlog por Prioridade (Resumo)

- **P0 (obrigatório para beta)**: 39 stories.
- **P1 (estabilização imediata)**: 18 stories.
- **P2 (pós-beta)**: 1 story.

---

## 18. Decisões de Produto Registradas

1. MVP é **web responsivo**, sem app mobile nativo.
2. Multitenancy com RLS é requisito de dia 1, sem exceção.
3. Agendamento sem confirmação explícita é proibido.
4. Onboarding inicial será white-glove/manual.
5. Auditoria de glosas e portal dos pais ficam fora do MVP.

---

## 19. Questões em Aberto para Kickoff Técnico

1. Qual throughput alvo por clínica para dimensionar fila e workers no beta?
2. Qual SLA contratual de resposta humana por clínica (janela comercial vs 24/7)?
3. Quais limites de custo por tenant para uso de tokens OpenAI no piloto?
4. Quais dashboards executivos serão obrigatórios para renovação comercial?

---

## 20. Aprovações

| Papel | Status |
|---|---|
| Product Owner (Gabriel) | Pendente de aprovação do PRD |
| PM (Morgan) | Elaborado |
| Tech Lead | Pendente |
| QA Lead | Pendente |

---


## 21. Adendo de Revisão Crítica (v1.1)

**Data**: 2026-02-08  
**Origem**: Revisão multiphase (Analyst + Architect + QA) registrada em `Docs/Brainstorming/13_prd_review_blindspots_v1.0.md`.

Este adendo incorpora as decisões aprovadas para resolver os pontos cegos críticos da primeira rodada.

## 21.1 Decisões Críticas Aprovadas

| ID | Decisão aplicada | Status |
|---|---|---|
| F1-1 | A+B+C (SLA contratual + tenant-aware + after-hours) | Aprovado |
| F1-2 | A+B (matriz legal + deny-by-default para ações sensíveis) | Aprovado |
| F2-1 | A+B (ordem por contato + dedupe por sequência/versionamento) | Aprovado |
| F2-2 | A+B (hardening service-role + testes de bypass) | Aprovado |
| F2-3 | A+B (DR formal com RPO/RTO + restore test recorrente) | Aprovado |
| F2-4 | A+B+C (secret manager + chaves segregadas + rotação emergencial) | Aprovado |
| F3-1 | A+C (UAT expandido + gate por cobertura crítica) | Aprovado |
| F3-2 | A+B+C (OWASP + authz tests + pentest pré-beta) | Aprovado |

## 21.2 Deltas Obrigatórios de Requisitos (Binding)

### A. Operação e SLA humano
1. SLA de takeover humano passa a ser requisito contratual por tenant.
2. SLA deve ser parametrizável por clínica sem deploy.
3. Política after-hours obrigatória: auto-resposta contextual + fila prioritária para callback humano.

### B. Governança legal de responsáveis
1. Ações sensíveis (`agendar`, `cancelar`, `dados clínicos`) operam em modo deny-by-default para responsável não verificado.
2. Fluxo de verificação de vínculo deve registrar método, data, aprovador e motivo.
3. Matriz legal de cenários de guarda deve existir no onboarding operacional da clínica.

### C. Confiabilidade de processamento
1. Processamento de mensagens deve preservar ordem por `contact_id`.
2. Dedupe transacional deve usar `external_id` + sequência/versionamento de conversa.
3. Eventos fora de ordem devem ser reprocessados com mecanismo de reconciliação e auditoria.

### D. Segurança de isolamento e credenciais
1. Credenciais de service-role não podem ser expostas fora da camada backend segura.
2. Deve existir suíte de teste negativa para tentativa de bypass de isolamento multi-tenant.
3. Gestão de segredos deve usar vault/secret manager com política de rotação periódica e rotação emergencial.
4. Chaves de integração devem ter escopo mínimo e trilha de auditoria de uso/rotação.

### E. Continuidade de negócio (DR)
1. Definir e publicar RPO/RTO por componente crítico (DB, fila, storage, integrações).
2. Teste de restauração em staging passa a ser obrigatório em janela recorrente.
3. Falha em restore test crítico bloqueia avanço de release para beta.

### F. Qualidade e segurança de entrega
1. UAT deve cobrir matriz por épico com cenários happy path, edge e error path.
2. Gate de entrada em beta exige 100% de aprovação dos cenários críticos definidos.
3. Segurança pré-beta obrigatória:
   - checklist OWASP API para fluxos críticos,
   - testes de authn/authz/RLS por perfil,
   - pentest leve com plano de remediação rastreável.

## 21.3 Deltas no Plano de Teste (v1.1)

Adicionar aos cenários obrigatórios de validação beta:
1. Tentativa de ação sensível por responsável não verificado deve falhar com resposta segura.
2. Simulação de webhook fora de ordem/duplicado não pode gerar side-effects duplicados.
3. Teste de bypass cross-tenant com credencial privilegiada deve falhar.
4. Teste de restore com objetivo de RPO/RTO aprovado em relatório.
5. Execução do checklist de segurança OWASP + authz + pentest com evidência anexada.

## 21.4 Governança de Execução

- Este adendo é **normativo** para as fases restantes do MVP.
- Históricos de revisão, decisão e alteração devem ser mantidos em:
  - `Docs/Brainstorming/13_prd_review_blindspots_v1.0.md`
  - versões futuras incrementais (`v1.1`, `v1.2`, ...).

---



## 22. Adendo de Revisão de Riscos Altos (v1.2)

**Data**: 2026-02-08  
**Origem**: Round 2 registrado em `Docs/Brainstorming/13_prd_review_blindspots_v1.1.md`.

Este adendo incorpora as decisões aprovadas para os pontos cegos de risco **alto** desta rodada.

## 22.1 Decisões Aprovadas (Round 2)

| ID | Decisão aplicada | Execução |
|---|---|---|
| F1-3 | A+B agora, C na semana final | Parcial imediato |
| F1-4 | A+B | Imediato |
| F1-5 | A+C, usando B para calibrar preço real | Imediato |
| F1-7 | A+B+C | Imediato |
| F2-5 | A+B | Imediato |
| F2-7 | A+C | Imediato |
| F2-8 | A+B, com C automatizado | Imediato |
| F3-3 | A+B | Imediato |
| F3-4 | A+B, com C na semana final | Parcial imediato |
| F3-5 | A+B | Imediato |
| F3-8 | A+B | Imediato |

Itens de risco alto **adiados com detalhamento técnico registrado**:
- F1-6, F2-6, F3-6, F3-7 (ver seção 12 de `Docs/Brainstorming/13_prd_review_blindspots_v1.1.md`).

## 22.2 Deltas Normativos de Produto e Entrega

### A. Governança de métricas e negócio
1. Todo KPI de produto passa a exigir definição de fórmula, fonte, owner e periodicidade.
2. O piloto deve operar em ondas e com estratificação de clínicas para reduzir viés amostral.
3. Go/no-go de beta passa a incluir unit economics mínimo e hipótese de pricing por faixa.
4. Métricas de valor percebido da família tornam-se obrigatórias (CSAT/NPS/churn por motivo).

### B. Resiliência e arquitetura operacional
1. Redis passa a ser dependência explícita de alta disponibilidade para lock/idempotência.
2. Deve existir fallback funcional para banco em modo degradado quando Redis indisponível.
3. SLO por jornada crítica é obrigatório, com orçamento de timeout por integração.
4. PromptOps passa a operar com rollout canary + shadow eval + auto-rollback por threshold.

### C. Qualidade, teste e rastreabilidade
1. Stories P0/P1 devem ter critérios de aceite mensuráveis e exemplos Given/When/Then.
2. Plano de carga deve definir volume alvo, latência/erro aceitáveis e critério de aprovação.
3. Matriz RTM (requisito -> teste -> evidência) é obrigatória para escopo P0.
4. Testes de resiliência com fault injection em staging e validação de fallback com SLA são obrigatórios.

## 22.3 Compromissos de Semana Final (Round 2)

1. F1-3 C: congelar baseline por tenant para fechamento analítico do piloto.
2. F3-4 C: executar soak test de longa duração no gate final pré-beta.

## 22.4 Pendências de Alto Risco não decididas nesta rodada

- F1-9 (dependência concentrada em WhatsApp) permanece pendente de decisão explícita.
- Status: aberto para Round 3.

## 22.5 Referência de Implementação e Auditoria

Toda decisão, racional e alteração desta rodada deve ser rastreada em:
- `Docs/Brainstorming/13_prd_review_blindspots_v1.1.md`

---



## 23. Adendo Final de Riscos Altos Pendentes (v1.3)

**Data**: 2026-02-08  
**Origem**: Round 3 registrado em `Docs/Brainstorming/13_prd_review_blindspots_v1.2.md`.

Este adendo fecha as decisões dos riscos altos que ainda estavam pendentes.

## 23.1 Decisões Aprovadas (Round 3)

| ID | Decisão aplicada | Status |
|---|---|---|
| F1-6 | A+B | Resolvido |
| F1-9 | B+C | Resolvido |
| F2-6 | Não implementar nesta rodada | Resolvido (deferido) |
| F3-6 | A+C | Resolvido |
| F3-7 | A+B imediato; C contínuo | Resolvido |

## 23.2 Deltas Normativos Aplicados

### A. F1-6 (A+B) - Ponte de valor para glosas
1. Produto adota abordagem "glosa-lite" no ciclo MVP para prevenção básica de erro evitável.
2. Roadmap pós-beta passa a ter compromisso formal de evolução de glosas com marco e escopo mínimo.

### B. F1-9 (B+C) - Dependência de WhatsApp
1. Fallback operacional manual é obrigatório para indisponibilidade do canal principal.
2. Matriz de comunicação de incidentes por tenant é obrigatória (owner, gatilho, canal e SLA de comunicação).

### C. F2-6 (deferido) - HA/scaling de N8N
1. Não implementar nesta rodada por decisão explícita do PO.
2. Risco aceito temporariamente e rastreado para próxima rodada arquitetural.
3. Recomendação técnica preservada para evolução: A+C como base, B para fluxos transacionais críticos.

### D. F3-6 (A+C) - Dados de teste
1. Fixtures por persona/tenant tornam-se obrigatórias nas suítes críticas.
2. Reset determinístico de ambiente torna-se obrigatório para regressão confiável.

### E. F3-7 (A+B imediato; C contínuo) - Casos de borda/negativos
1. Stories P0/P1 devem incluir critérios de aceite para happy/edge/error.
2. Checklist de borda por domínio entra no gate QA.
3. Métrica de defeito escapado por categoria passa a orientar melhoria contínua.

## 23.3 Status Consolidado de Riscos Altos

- Riscos altos tratados com decisão explícita: **100%**.
- Componente deferido com aceite de risco explícito: **F2-6**.

## 23.4 Referência de Rastreabilidade

Histórico completo de decisão e análise:
- `Docs/Brainstorming/13_prd_review_blindspots_v1.0.md`
- `Docs/Brainstorming/13_prd_review_blindspots_v1.1.md`
- `Docs/Brainstorming/13_prd_review_blindspots_v1.2.md`

---



## 24. Adendo de Riscos Médios e Nova Varredura (v1.4)

**Data**: 2026-02-08  
**Origem**: Round 4 registrado em `Docs/Brainstorming/13_prd_review_blindspots_v1.3.md`.

Este adendo registra as decisões para riscos médios e referencia a nova varredura de riscos críticos/altos em 3 fases.

## 24.1 Decisões Aprovadas (Riscos Médios)

| ID | Decisão aplicada | Status |
|---|---|---|
| F1-8 | A+B | Resolvido |
| F1-10 | A+B | Resolvido |
| F2-9 | A+C | Resolvido |
| F2-10 | A+B | Resolvido |
| F3-9 | A+B (interpretação de entrada "Q+B") | Resolvido |
| F3-10 | A+C | Resolvido |

## 24.2 Deltas Normativos Aplicados

### A. F1-8 (A+B)
1. Onboarding passa a incluir trilha obrigatória de treinamento por papel.
2. Adoção operacional passa a ter metas e monitoramento semanal por clínica.

### B. F1-10 (A+B)
1. Kill criteria do piloto torna-se obrigatório e explícito.
2. Gatilhos de scale-up com janela mínima de evidência tornam-se obrigatórios.

### C. F2-9 (A+C)
1. Fair scheduling por tenant passa a ser requisito do processamento.
2. Backpressure com priorização de mensagens críticas por tenant passa a ser requisito.

### D. F2-10 (A+B)
1. Mudanças de schema passam a seguir padrão expand/contract.
2. Migração+rollback em staging passa a ser gate de mudança estrutural.

### E. F3-9 (A+B)
1. Acessibilidade mínima em telas P0/P1 torna-se requisito obrigatório.
2. Matriz de dispositivos/viewport suportados entra no plano oficial de teste.

### F. F3-10 (A+C)
1. Release scorecard torna-se gate obrigatório.
2. SLA de correção por severidade pós-go-live torna-se requisito auditável.

## 24.3 Referência da Nova Varredura 3 Fases

A varredura adicional solicitada (somente riscos crítico/alto) está registrada em:
- `Docs/Brainstorming/13_prd_review_blindspots_v1.3.md` (seção 22)

## 24.4 Observação de Interpretação

- O item "F3-9 Q+B" foi interpretado como **A+B** por provável erro de digitação.
- Caso deseje outra combinação, registrar ajuste no próximo round (v1.5+).

---

## 25. Adendo de Mitigação Mínima para Alerta Crítico (v1.5)

**Data**: 2026-02-09  
**Origem**: decisão formal do PO na consolidação final da varredura crítica/alta.

Este adendo aplica mitigação mínima para risco crítico de resposta a alertas sem ACK, sem exigir equipe clínica 24/7.

## 25.1 Decisão Aprovada (Round 5)

| ID | Tema | Decisão aplicada | Status |
|---|---|---|---|
| F4-10 | Alerta crítico sem ACK | A+B (versão mínima) | Resolvido com mitigação mínima |

## 25.2 Política Normativa (trigger -> canal -> owner -> SLA de ACK)

1. Trigger: alerta técnico crítico sem ACK do responsável.
2. Canal: WhatsApp para superadmin, com reenvio redundante no mesmo canal.
3. Owner: superadmin do tenant.
4. SLA de ACK: 15 minutos.
5. Reenvio automático: a cada 5 minutos por 30 minutos ou até ACK.

## 25.3 Fail-safe Obrigatório (sem ACK em 15 min)

1. Entrar em modo seguro.
2. Bloquear side-effects (`agendar`, `reagendar`, `cancelar`).
3. Manter ingestão normal e enfileirar pendências.
4. Enviar mensagem padrão de contingência.
5. Abrir ticket crítico para ação no próximo turno.

## 25.4 Guardrails Operacionais

1. Esta política não impõe equipe clínica 24/7.
2. O atendimento humano continua conforme janela comercial definida por tenant.
3. A saída do modo seguro exige ACK registrado e ação auditável.

## 25.5 Rastreabilidade

- Mitigação aplicada para desbloquear critério de avanço sem risco crítico descoberto e sem resposta definida.
- Referência complementar: `docs/PRD/13_prd_review_blindspots_v1.3.md` (Round 5).

---

**Fim do PRD v1.5**
