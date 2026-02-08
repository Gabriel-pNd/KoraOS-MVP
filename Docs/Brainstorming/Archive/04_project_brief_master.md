# Project Brief: KoraOS MVP
## Infraestrutura de IA para Clínicas Multidisciplinares de Neurodivergentes

**Data de Criação**: 2026-02-07  
**Versão**: 1.0 (Post-Refinement)  
**Owner**: Gabriel (Founder)  
**Preparado por**: Atlas (Business Analyst)  
**Status**: Ready for PM Handoff

---

## 📋 Executive Summary

**KoraOS** é uma infraestrutura vertical de IA para clínicas multidisciplinares que atendem crianças neurodivergentes (TEA, ADHD). O MVP foca em **resolver 3 dores operacionais críticas** identificadas em pesquisa de campo:

1. **Aquisição de Leads** - Atendimento WhatsApp 24/7 com IA (Lívia)
2. **Gestão de Agendamentos** - Redução de no-shows e logística de múltiplas terapias
3. **Gestão Operacional** - Dashboard para secretária e gestor

**Modelo de Negócio**: SaaS B2B multitenant com precificação baseada em ROI (receita aumentada + despesa reduzida + margem expandida).

**Go-to-Market**: Beta gratuita para captar resultados mensuráveis, seguida de cobrança baseada em valor entregue.

**Validação**: 30-60-90 dias com 1-4 clínicas piloto.

---

## 🎯 Problem Statement

### Contexto de Mercado
Clínicas de ABA e terapias multidisciplinares (Fonoaudiologia, Terapia Ocupacional, Psicologia) para neurodivergentes operam em **falência operacional invisível**:

- **Taxa de no-show**: 20-30% (padrão do mercado)
- **Perda de leads**: 70% dos contatos fora do horário comercial não convertem
- **Atendimento desumanizado**: Uso de protocolos frios, chatbots ruins, áudios excessivos
- **Burnout de equipe**: Secretárias gerenciam 200+ conversas no WhatsApp sem ferramentas

### Pain Points Validados (Pesquisa de Campo)
Baseado em 3 documentos de pesquisa:

1. **Mystery Shopper** - 5 falhas críticas no atendimento:
   - Protocolos desumanizados
   - Price dumping (anunciar preço antes de valor)
   - Áudios como resposta padrão
   - Bots inúteis que geram loops
   - Falta de atendimento 24/7

2. **Pesquisa de Dores Operacionais**:
   - "WhatsApp Hell" (secretária não consegue acompanhar volume)
   - Agendamentos manuais causam erros e retrabalho
   - Falta de visibilidade sobre confirmações

3. **Gap de Infraestrutura de IA**:
   - Ferramentas isoladas (chatbot + CRM + agenda) não conversam
   - Falta de solução end-to-end para o nicho

---

## 🚀 Project Goals

### Primary Objectives (MVP)
1. **Captar 100% dos leads** mesmo fora do horário comercial (24/7 via IA)
2. **Reduzir no-show para < 10%** via confirmação automática inteligente
3. **Reduzir carga operacional** da secretária em 50% (automação de agendamento)
4. **Validar modelo multitenant** com 1-4 clínicas em 90 dias

### Success Metrics
| Métrica | Baseline (Sem KoraOS) | Meta MVP | Como Medir |
|---------|----------------------|----------|-----------|
| Taxa de Conversão de Leads | 20-30% | > 30% | (Leads agendados / Leads captados) × 100 |
| Taxa de No-Show | 20-30% | < 10% | (Faltas / Agendamentos) × 100 |
| Leads perdidos (fora horário) | ~70% | < 20% | Comparar leads noturnos/finais de semana antes vs depois |
| Tempo médio de resposta | 8h+ | < 5min (IA) / < 1h (humano) | Timestamp primeira resposta |
| NPS (Satisfação Admin) | N/A | > 8/10 | Survey mensal |

### Non-Goals (Out of Scope for MVP)
- ❌ Portal dos Pais (v1.1+)
- ❌ Auditoria de Glosas TISS (pós-MVP)
- ❌ Prontuário Eletrônico completo
- ❌ Evolução clínica de pacientes
- ❌ ERP Financeiro (folha de pagamento, contas a pagar)
- ❌ App mobile nativo (web responsive apenas)

---

## 🛠️ Technical Architecture

### High-Level Stack

```
┌─────────────────────────────────────────────────────────┐
│                    USUÁRIOS FINAIS                      │
│   (Gestor | Secretária | Terapeuta | Leads via WhatsApp)│
└──────────────────────┬──────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
┌───────▼─────────┐          ┌────────▼────────┐
│   WEB APP       │          │  WHATSAPP       │
│   (Next.js)     │          │  (Uazapi API)   │
│   - Dashboard   │          │  - Lívia (IA)   │
│   - Agenda      │          │  - Confirmações │
│   - Leads       │          └────────┬────────┘
└───────┬─────────┘                   │
        │                             │
        └──────────┬──────────────────┘
                   │
           ┌───────▼───────┐
           │   N8N AGENTS  │
           │  (Self-hosted)│
           │  - Lívia      │
           │  - Confirmação│
           │  - Agendamento│
           │  - Follow-up  │
           │  - Escalação  │
           └───────┬───────┘
                   │
        ┌──────────▼──────────────┐
        │   SUPABASE              │
        │   - PostgreSQL (RLS)    │
        │   - Auth                │
        │   - Storage             │
        └─────────────────────────┘
```

### Technology Decisions (Validated)

| Component | Technology | Rationale |
|-----------|------------|-----------|
| **Frontend** | Next.js 14 (App Router) | SSR, API routes, performance |
| **UI Framework** | Shadcn UI + TailwindCSS | Componentes prontos, customizável |
| **Database** | PostgreSQL (Supabase) | RLS nativo, escalável |
| **Multitenancy** | Row-Level Security (RLS) | Simples, custo-efetivo para MVP |
| **Automation** | N8N (self-hosted) | Controle total, modular |
| **WhatsApp** | Uazapi (não-oficial) → Oficial (futuro) | Rápido para MVP, migrar depois |
| **AI** | OpenAI API (GPT-4) | Lívia, follow-up, análise de sentimento |
| **Auth** | Supabase Auth | Multitenant nativo |
| **Hosting** | Vercel (frontend) + Railway (N8N) | Escalável, managed |

---

## 🏗️ MVP Scope Definition

### Core Features ("Two-Legged Stool")

#### **Perna 1: Lívia - Agente de WhatsApp (RICE: 13.5)**

**Descrição**: IA conversacional 24/7 para atendimento de leads via WhatsApp.

**Funcionalidades**:
- Atendimento empático (sem protocolos numéricos)
- Aplicação de SPIN Selling (contexto → problemas → implicações → solução)
- Triagem automática: Nome do responsável, Nome da criança, Idade, Laudo, Disponibilidade
- Apenas texto (nunca áudio)
- Detecção de frustração → escalação para humano
- Criação automática de lead no database

**Fluxos N8N (Modularizados)**:
1. `webhook_whatsapp_incoming` - Recebe mensagem via Uazapi
2. `classify_intent` - OpenAI classifica intenção (novo lead, dúvida, reagendamento)
3. `query_lead_history` - Busca histórico do número no Supabase
4. `generate_response` - OpenAI com prompt SPIN + histórico
5. `send_whatsapp_message` - Envia resposta via Uazapi
6. `persist_conversation` - Salva no Supabase (audit trail)
7. `escalate_to_human` - Se detectar frustração, cria ticket

**Entidades**:
- `leads` (status: novo, em_conversa, agendado, convertido, perdido)
- `conversations` (histórico WhatsApp)
- `conversation_messages` (mensagens individuais)
- `support_tickets` (escalações para humano)

---

#### **Perna 2: Sistema de Agendamento Inteligente (RICE: 12.6)**

**Descrição**: Otimização de logística para múltiplas terapias + confirmação automática.

**Funcionalidades**:

**2A. Agendamento Sequencial Otimizado**
- **Problema**: Paciente com ABA + Fono + TO precisa ir à clínica 3x/semana
- **Solução**: Agendar múltiplos terapeutas no MESMO DIA (ex: 14h Fono, 16h ABA)
- **Fallback**: Se não há slots sequenciais, agenda em dias diferentes
- **UI**: Secretária vê sugestões de combinações otimizadas, confirma manualmente

**2B. Confirmação Automática**
- **Cron job** (diário às 8h): Query agendamentos próximas 24h
- **Mensagem WhatsApp**: "Oi [Nome Mãe], confirmando sessão de [Criança] amanhã às [Hora] com [Terapeuta]. Responda SIM para confirmar."
- **Webhook**: Captura resposta (SIM/NÃO), update status
- **Detecção de risco**: Se paciente tem 2+ no-shows, marcar `risk_level: high`

**2C. Reagendamento e Cancelamento em Lote**
- **Casos de uso**: Férias do terapeuta, doença do paciente
- **UI**: Selecionar range de datas + motivo → cancela todos os agendamentos
- **Notificação**: WhatsApp automático para afetados
- **Auditoria**: Registra quem cancelou, quando, motivo

**Fluxos N8N (Modularizados)**:
1. `checkTherapistAvailability` - Input: terapeuta + data → Output: slots livres
2. `findSequentialSlots` - Input: terapias[] + dias[] → Output: combinações possíveis
3. `createAppointmentSeries` - Input: schedule + recorrência → Output: N agendamentos
4. `cancelAppointmentBatch` - Input: range + motivo → Output: cancelados + notificações
5. `rescheduleAppointment` - Input: appointment_id + nova data → Output: atualizado
6. `sendConfirmationMessage` - Cron daily → envia WhatsApp para agendamentos próximos

**Entidades**:
- `appointments` (campos: status, confirmation_status, deleted_at, deleted_by)
- `therapists` (availability_json: grid semanal)
- `patients` (no_show_count, risk_level)

---

#### **Perna 3: Agente de Follow-Up (NOVO)**

**Descrição**: Reengaja leads que conversaram com Lívia mas não agendaram.

**Lógica**:
- **Cron job** (diário): Query leads com status `em_conversa` e última mensagem > 3 dias
- **Mensagem**: "Oi [Nome], como está [Criança]? Ainda tem interesse em conhecer nossa metodologia? Temos horários disponíveis essa semana."
- **Limite**: Máximo 2 follow-ups (depois, marcar como `perdido`)

**Entidades**:
- `leads.followup_count` (contador)
- `leads.last_followup_at` (timestamp)

---

#### **Perna 4: Escalação Humana (Human Handoff)**

**Descrição**: Transferência IA → Recepcionista quando necessário.

**Triggers**:
- **Manual**: Usuário digita "falar com atendente", "quero humano"
- **Automático**: OpenAI detecta frustração (palavras negativas repetidas)

**Fluxo**:
1. Lívia envia: "Vou transferir você para nossa recepcionista. Aguarde um momento."
2. N8N cria `support_ticket` no database
3. Web App mostra notificação em tempo real para secretária
4. Secretária assume conversa pelo Web App (ou WhatsApp Business)
5. Ao resolver, marca ticket como `resolved` e pode devolver para Lívia

**Entidades**:
- `support_tickets` (status: open, in_progress, resolved; reason: frustration, pricing, complaint)

---

### N8N Modularization Principles

**Anti-Pattern (Evitar)**: Workflows "megazord" com 100+ nós conectados.

**Best Practice**:
- Cada função = 1 workflow separado
- Comunicação via HTTP Request entre workflows
- Reutilização de módulos (ex: `sendWhatsAppMessage` chamado por múltiplos pais)
- Facilita debug e manutenção

**Exemplo de Arquitetura**:
```
livia_main_flow (orquestrador)
  ├─ call → classify_intent
  ├─ call → query_lead_history
  ├─ call → generate_response
  └─ call → send_whatsapp_message
```

---

## 🖥️ Web App: Screen Architecture

### Personas & Access Control

| Persona | Telas Acessíveis | Permissões |
|---------|-----------------|------------|
| **Secretária/Recepção** | Home, Comercial (Kanban), Agenda (3 visões), Contatos | Criar/editar agendamentos, converter leads, ver tickets |
| **Gestor/Admin** | Tudo da Secretária + Dashboard Executivo, Gestão Usuários, Gestão Terapeutas, Configurações | Criar usuários, ver métricas estratégicas, configurar clínica |
| **Terapeuta** | (Fora do MVP) | - |
| **Super Admin (Gabriel)** | Dashboard Global, Gestão Tenants, Auditoria Global, Monitoramento Infraestrutura | Bypass RLS, ver todas as clínicas, impersona usuários |

---

### Telas da RECEPÇÃO (Must-Have MVP)

#### **1. Home - "O que devo fazer agora?"**
**Objetivo**: Priorizar tarefas do dia.

**Widgets**:
- 🚨 **Alertas Urgentes**: "3 confirmações pendentes para hoje", "2 tickets aguardando resposta"
- 📋 **Tarefas do Dia**: Checklist gerada automaticamente
- 📊 **Resumo Rápido**: Leads ativos, Agendamentos hoje, Taxa de conversão semana

**Prioridade**: ⭐⭐⭐⭐⭐ CRÍTICO

---

#### **2. Comercial - Pipeline de Vendas (Kanban)**
**Objetivo**: Visualizar funil de leads atendidos pela Lívia.

**Colunas**:
1. **Em Qualificação** - Lívia ainda coletando dados
2. **Follow Up** - Lead respondeu mas não agendou (awaiting follow-up)
3. **Agendado** - Primeira consulta agendada
4. **Confirmado** - Paciente confirmou presença
5. **Sucesso!** - Virou paciente ativo

**Funcionalidades**:
- Drag & drop para mudar status (opcional MVP, pode ser botões)
- Badge de tempo: "há 3 dias nesta coluna"
- Filtros: Origem (WhatsApp, Site), Diagnóstico
- Click no card: Abre detalhes do lead

**Prioridade**: ⭐⭐⭐⭐⭐ CRÍTICO

---

#### **3. Agenda - 3 Visões**
**Objetivo**: Visualizar agendamentos com nível de detalhe variável.

**3.1 Visão DIA (Hiper Detalhada)**
- Matrix: Hora × Terapeuta
- Mostra: Nome paciente, Tipo terapia, Status confirmação, Observações
- **Exemplo**: "08:00 - Dr. João: Pedro Costa (4 anos) - ABA - ✅ Confirmado - 📝 'Trabalhar mandos'"

**3.2 Visão SEMANA (Resumida)**
- Grid: Dia × Hora
- Mostra: Nome paciente + Status (cores)
- **Legenda**: 🟢 Confirmado, 🟡 Pendente, 🔴 Cancelado

**3.3 Visão MÊS (Hiper Simplificada)**
- Calendário mensal
- Mostra: Quantidade de agendamentos por dia
- **Cores de intensidade**: Poucos (claro), Muitos (escuro)

**Prioridade**: ⭐⭐⭐⭐⭐ CRÍTICO

---

#### **4. Contatos - Leads + Pacientes**
**Objetivo**: Lista unificada de todos os contatos.

**Tabs**:
- Todos (leads + pacientes)
- Leads (apenas prospects)
- Pacientes (apenas convertidos)

**Campos da Tabela**:
- Tipo (🔵 Lead / 🟢 Paciente)
- Nome Responsável
- Criança (nome + idade)
- Telefone
- Status

**Filtros**: Por status, diagnóstico, data de criação, última interação

**Prioridade**: ⭐⭐⭐⭐ IMPORTANTE

---

### Telas do GESTOR (Must-Have MVP)

#### **5. Dashboard Executivo**
**Objetivo**: Métricas estratégicas (não operacionais).

**Métricas**:
1. **Funil de Leads**: Captados → Em conversa → Agendados → Convertidos (Taxa de conversão %)
2. **Performance de Agendamentos**: Sessões realizadas, Taxa confirmação, Taxa no-show, Comparação mês anterior
3. **Performance de Terapeutas**: Horas faturáveis, Taxa ocupação, Pacientes ativos
4. **Saúde da Operação**: Ativos vs inativos, Taxa retenção, Tempo médio resposta
5. **Alertas Estratégicos**: Terapeutas baixa ocupação, Leads sem follow-up, Taxa no-show acima meta

**Prioridade**: ⭐⭐⭐⭐ IMPORTANTE

---

#### **6. Gestão de Usuários**
**Objetivo**: Criar e gerenciar secretárias e terapeutas.

**Funcionalidades**:
- Lista de usuários (Nome, Email, Função, Status)
- [+ Adicionar Usuário] - Modal com: Nome, Email, Função (dropdown), Especialidades (se Terapeuta)
- [Editar] - Alterar permissões
- [Ativar/Desativar] - Soft delete

**Prioridade**: ⭐⭐⭐⭐ IMPORTANTE

---

#### **7. Gestão de Terapeutas**
**Objetivo**: Configurar especialidades e disponibilidade.

**Funcionalidades**:
- Lista de terapeutas (Nome, Especialidades, Pacientes ativos, Horas/semana, Ocupação)
- [Editar] → Perfil do Terapeuta:
  - Dados cadastrais (CRP/CRFa)
  - Especialidades (checkboxes: ABA, Fono, TO, Psico)
  - **Editor de Disponibilidade**: Grid semanal (Seg-Sáb, 8h-18h), clique para toggle, salvo em `availability_json`

**Prioridade**: ⭐⭐⭐⭐ IMPORTANTE

---

#### **8. Configurações da Clínica** (Should-Have v1.1)
**Seções**:
- Dados Gerais (Nome, CNPJ, Endereço)
- Configurações de Agendamento (Duração padrão, Intervalo, Horário funcionamento)
- Integrações (WhatsApp API Key, N8N URL, Status conexões)

**Prioridade**: ⭐⭐⭐ MÉDIO (v1.1)

---

### Telas do SUPER ADMIN (Should-Have v1.1)

#### **9. Dashboard Global (Multi-Tenant)**
**Métricas Globais**:
- Clínicas Ativas
- Total Leads (todas clínicas)
- Total Pacientes Ativos
- Taxa Conversão Média
- Uptime Plataforma

**Tabela de Clínicas**: Nome, Status, Leads, Pacientes, Conversão, Último acesso admin

**Ações**: [Ver Dashboard], [Logar como Admin], [Pausar/Reativar], [Ver Auditoria]

**Prioridade**: ⭐⭐⭐ MÉDIO (v1.1)

---

#### **10. Gestão de Tenants**
**Funcionalidades**:
- [+ Criar Nova Clínica] - Formulário: Nome, Email admin, Plano (Trial/Pago), Região
- Lista de tenants (ID, Nome, Plano, Status)

**Prioridade**: ⭐⭐⭐ MÉDIO (v1.1)

---

#### **11. Auditoria Global**
**Funcionalidades**:
- Logs de TODAS as clínicas
- Filtros: Clínica, Usuário, Tipo de ação (create/update/delete), Entidade, Período
- Tabela: Timestamp, Clínica, Usuário, Ação, Entidade, Detalhes (before/after)

**Prioridade**: ⭐⭐⭐ MÉDIO (v1.1)

---

#### **12. Monitoramento de Infraestrutura**
**Widgets**:
- N8N Workflows (Total, Execuções hoje, Erros 24h)
- Supabase (Conexões ativas, Latência, Storage usado)
- Uazapi (Mensagens enviadas, Taxa entrega, Status API)
- Erros Recentes (Stack traces, Filtro por severidade)

**Prioridade**: ⭐⭐⭐ MÉDIO (v1.1)

---

## 🔒 Security & Compliance

### Auditoria e Não-Repúdio (MVP Core)

**Princípio**: Toda alteração/deleção é rastreável e JAMAIS pode ser alterada ou apagada.

#### **Soft Delete (Nunca Deletar Fisicamente)**
```sql
ALTER TABLE appointments ADD COLUMN deleted_at TIMESTAMP;
ALTER TABLE appointments ADD COLUMN deleted_by UUID REFERENCES users(id);
ALTER TABLE patients ADD COLUMN deleted_at TIMESTAMP;
ALTER TABLE patients ADD COLUMN deleted_by UUID REFERENCES users(id);

-- Queries filtram: WHERE deleted_at IS NULL
```

#### **Tabela de Auditoria Universal**
```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  user_id UUID REFERENCES users(id), -- quem fez
  action TEXT, -- 'create', 'update', 'delete', 'cancel'
  entity_type TEXT, -- 'appointment', 'patient', 'lead'
  entity_id UUID, -- ID do registro afetado
  changes JSONB, -- {"before": {}, "after": {}}
  reason TEXT, -- "Paciente solicitou cancelamento"
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_user ON audit_log(user_id);
```

#### **Trigger Automático (PostgreSQL)**
- Toda operação INSERT/UPDATE/DELETE em tabelas críticas dispara trigger
- Trigger popula `audit_log` automaticamente
- Campos `before` e `after` com snapshot completo do registro

#### **UI de Auditoria**
- Tela: "Histórico de Alterações" (por entidade)
- Mostra: Quem, Quando, O quê mudou, Antes/Depois
- **SOMENTE LEITURA** (imutável)

**Visibilidade**:
- Gestor: Vê auditoria da SUA clínica
- Super Admin: Vê auditoria de TODAS as clínicas

---

### Multitenancy & Data Isolation

**Estratégia**: Row-Level Security (RLS) com Supabase

**Implementação**:
```sql
-- Tabela users com flag super admin
CREATE TABLE users (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id), -- NULL se super admin
  email TEXT UNIQUE,
  role TEXT, -- 'super_admin', 'admin', 'secretary', 'therapist'
  is_super_admin BOOLEAN DEFAULT false
);

-- RLS Policy (exemplo para patients)
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON patients
  USING (
    tenant_id = current_setting('app.current_tenant')::UUID
    OR current_setting('app.is_super_admin')::BOOLEAN = true
  );

-- No Next.js, antes de cada query:
-- SET app.current_tenant = 'uuid-da-clinica';
-- SET app.is_super_admin = false; (ou true se Gabriel)
```

**Hierarquia de Permissões**:
1. **Super Admin (Gabriel)**: Bypassa RLS, vê todos os tenants
2. **Admin/Gestor**: Vê apenas SUA clínica
3. **Secretária**: Vê leads, pacientes, agendamentos da clínica
4. **Terapeuta**: Vê APENAS seus próprios pacientes

---

## 💾 Database Schema (Core Entities)

### Entidades Principal (MVP)

```sql
-- MULTITENANT
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- USUÁRIOS
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  email TEXT UNIQUE,
  role TEXT,
  name TEXT,
  is_super_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- TERAPEUTAS (extensão de users)
CREATE TABLE therapists (
  id UUID PRIMARY KEY REFERENCES users(id),
  tenant_id UUID REFERENCES tenants(id),
  specialties TEXT[], -- ['ABA', 'Fono', 'TO', 'Psico']
  availability_json JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- LEADS
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  parent_name TEXT,
  phone TEXT,
  child_name TEXT,
  child_age INT,
  diagnosis TEXT,
  availability_notes TEXT,
  status TEXT, -- 'novo', 'em_conversa', 'agendado', 'convertido', 'perdido'
  source TEXT, -- 'whatsapp', 'indicacao', 'site'
  followup_count INT DEFAULT 0,
  last_followup_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  converted_at TIMESTAMP
);

-- CONVERSAS WhatsApp
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  lead_id UUID REFERENCES leads(id),
  phone TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id),
  sender TEXT, -- 'lead' ou 'livia'
  message TEXT,
  sent_at TIMESTAMP DEFAULT NOW()
);

-- TICKETS DE ESCALAÇÃO
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  lead_id UUID REFERENCES leads(id),
  conversation_id UUID REFERENCES conversations(id),
  status TEXT, -- 'open', 'in_progress', 'resolved'
  assigned_to UUID REFERENCES users(id),
  reason TEXT, -- 'frustration', 'pricing', 'complaint'
  created_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP
);

-- PACIENTES
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  lead_id UUID REFERENCES leads(id),
  name TEXT,
  birth_date DATE,
  diagnosis TEXT,
  parent_name TEXT,
  parent_phone TEXT,
  no_show_count INT DEFAULT 0,
  risk_level TEXT, -- 'low', 'medium', 'high'
  deleted_at TIMESTAMP,
  deleted_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- AGENDAMENTOS
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  patient_id UUID REFERENCES patients(id),
  therapist_id UUID REFERENCES therapists(id),
  therapy_type TEXT, -- 'ABA', 'Fono', 'TO', 'Psico'
  scheduled_at TIMESTAMP,
  duration_minutes INT DEFAULT 120,
  location TEXT, -- 'clinic' ou 'home'
  status TEXT, -- 'scheduled', 'confirmed', 'completed', 'no_show', 'cancelled'
  confirmation_status TEXT, -- 'pending', 'confirmed'
  confirmation_sent_at TIMESTAMP,
  deleted_at TIMESTAMP,
  deleted_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- AUDITORIA
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  user_id UUID REFERENCES users(id),
  action TEXT,
  entity_type TEXT,
  entity_id UUID,
  changes JSONB,
  reason TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Índices Críticos**:
```sql
CREATE INDEX idx_appointments_therapist ON appointments(therapist_id, scheduled_at);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_leads_status ON leads(tenant_id, status);
CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
```

---

## 📅 Roadmap & Milestones

### Phase 1: Foundation (Weeks 1-2)
**Goal**: Infrastructure setup

**Deliverables**:
- [ ] Supabase project created (database + auth)
- [ ] Next.js app scaffolded (Shadcn UI + TailwindCSS)
- [ ] N8N self-hosted on Railway/Render
- [ ] Database schema deployed (all tables + RLS policies)
- [ ] Seed data (1 tenant de teste)
- [ ] Uazapi integration tested (send/receive 1 message)

**Success Criteria**: Can create user, login, send WhatsApp message via N8N

---

### Phase 2: Lívia (WhatsApp Agent) (Weeks 3-4)
**Goal**: AI conversational agent operational

**Deliverables**:
- [ ] N8N flow: Webhook Uazapi → Classify intent → Generate response → Send
- [ ] OpenAI prompts (SPIN Selling template)
- [ ] Lead creation automatic
- [ ] Conversation persistence
- [ ] Web App: Tela "Comercial" (Kanban básico - sem drag/drop OK)
- [ ] Web App: Tela "Contatos" (lista leads)

**Success Criteria**: Lívia responde 24/7, cria leads no database, secretária visualiza no Kanban

---

### Phase 3: Agendamento + Confirmação (Weeks 5-6)
**Goal**: Scheduling system + anti-no-show

**Deliverables**:
- [ ] Web App: Tela "Agenda" (3 visões: Dia, Semana, Mês)
- [ ] N8N: `checkTherapistAvailability` module
- [ ] N8N: `findSequentialSlots` module (otimização logística)
- [ ] N8N: `createAppointmentSeries` (agendamento recorrente)
- [ ] N8N: Cron job confirmação automática (daily 8h)
- [ ] N8N: Webhook captura resposta WhatsApp (SIM/NÃO)
- [ ] Web App: Tela "Confirmações Pendentes"

**Success Criteria**: Secretária agenda múltiplas terapias no mesmo dia, confirmação automática funciona

---

### Phase 4: Follow-up + Escalação (Week 7)
**Goal**: Reengajamento + human handoff

**Deliverables**:
- [ ] N8N: Agente de Follow-up (cron daily, max 2 follow-ups)
- [ ] N8N: Detecção de frustração (OpenAI sentiment analysis)
- [ ] N8N: Criação de `support_tickets`
- [ ] Web App: Tela "Tickets de Escalação" (secretária)
- [ ] Web App: Notificação em tempo real (novo ticket)

**Success Criteria**: Leads esfriadosexos recebem follow-up, escalação para humano funciona

---

### Phase 5: Gestor Dashboards (Week 8)
**Goal**: Strategic visibility for clinic owner

**Deliverables**:
- [ ] Web App: Tela "Dashboard Executivo" (métricas funil, performance)
- [ ] Web App: Tela "Gestão de Usuários"
- [ ] Web App: Tela "Gestão de Terapeutas" (com editor de disponibilidade)
- [ ] Queries SQL otimizadas para métricas

**Success Criteria**: Gestor vê taxa de conversão, no-show rate, ocupação de terapeutas

---

### Phase 6: Auditoria + SuperAdmin (Week 9)
**Goal**: Non-repudiation + platform administration

**Deliverables**:
- [ ] Triggers PostgreSQL (audit_log automático)
- [ ] Web App: Tela "Histórico de Alterações" (por entidade)
- [ ] Web App: Tela "Dashboard Global" (SuperAdmin)
- [ ] Web App: Tela "Gestão de Tenants" (criar clínica)
- [ ] RLS bypass para SuperAdmin

**Success Criteria**: Todas as alterações são auditadas, Gabriel vê todas as clínicas

---

### Phase 7: Pilot Launch (Week 10-12)
**Goal**: Onboard first paying clinic

**Deliverables**:
- [ ] Onboarding manual (Gabriel configura):
  - Criar tenant
  - Cadastrar admin da clínica
  - Cadastrar terapeutas (+ disponibilidade)
  - Importar pacientes existentes (CSV)
  - Conectar WhatsApp (Uazapi API key)
- [ ] Training para secretária (2h session)
- [ ] Go-live monitoring (daily check-ins)
- [ ] Collect metrics (conversão, no-show, NPS)

**Success Criteria**: Clínica aceita pagar após beta, no-show < 10%, NPS > 8/10

---

## 💰 Business Model

### Pricing Strategy
**Modelo**: Personalizado baseado em ROI

**Fórmula**:
```
Valor Mensal = (Receita Aumentada + Despesa Reduzida + Margem Expandida) × 0.20
```

**Exemplo**:
- Clínica gera R$ 50k/mês
- Lívia aumenta conversão 20% → +R$ 10k/mês
- Anti-no-show economiza 10% sessões → +R$ 5k/mês
- **ROI mensal**: R$ 15k
- **Preço sugerido**: R$ 3k/mês (20% do ROI)

**Justificativa**: Cliente paga apenas uma fração do valor gerado.

---

### Go-to-Market
**Fase 1 (MVP)**: Beta gratuita
- Onboard 1-4 clínicas
- Coletar resultados mensuráveis (antes vs depois)
- Case study documentado

**Fase 2 (v1.1)**: Cobrança baseada em resultados
- Apresentar case study
- Pricing personalizado por clínica
- Target: R$ 1.500 - R$ 5.000/mês por clínica

**Fase 3 (v2+)**: Escala
- Feature flags (Portal dos Pais, Auditoria Glosas)
- Tiered pricing (Starter, Pro, Enterprise)

---

## 🎓 Key Insights & Assumptions

### Validated Insights
1. **Clínicas estão em falência operacional invisível** - Não precisam de "otimização", precisam de resgate
2. **Dados são reféns, não ativos** - Migração zero-loss é crítica para confiança
3. **Trabalho invisível é onde está o ouro** - Reduzir 1h/dia de admin = R$ 800/mês/terapeuta economizado
4. **Pais não entendem ABA, mas decidem pagar** - Portal dos Pais (v2) será anti-churn insurance
5. **Lívia pode ser produto standalone** - Validar tração vendendo só chatbot reduz risco

### Assumptions to Validate
- [ ] Secretárias vão confiar e usar IA (não boicotar)
- [ ] Clínicas concordam em pagar APÓS beta (não querem grátis para sempre)
- [ ] Uazapi (não-oficial) é estável suficiente para MVP
- [ ] RLS (não schema-per-tenant) é seguro para LGPD
- [ ] 90 dias é tempo suficiente para provar valor

---

## 📊 Success Metrics (MVP Validation)

| Métrica | Target | Como Medir | Responsável |
|---------|--------|-----------|-------------|
| **Clínicas onboarded** | 1-4 | Supabase (count tenants) | Gabriel |
| **Taxa de conversão leads** | > 30% | (Agendados / Captados) × 100 | Lívia (N8N) |
| **Taxa de no-show** | < 10% | (Faltas / Agendamentos) × 100 | Confirmação (N8N) |
| **NPS (Satisfação Admin)** | > 8/10 | Survey mensal | Gabriel |
| **Churn** | 0% | (Clientes que cancelaram / Total) | Gabriel |
| **Uptime Lívia** | > 99% | N8N monitoring | Gabriel |
| **Leads perdidos fora horário** | < 20% | Comparar antes vs depois | Lívia analytics |

---

## 🚧 Risks & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **Uazapi banimento WhatsApp** | Média | Alta | Migrar para API oficial se ocorrer (contingência documentada) |
| **Clínica rejeita multitenancy (quer dedicado)** | Baixa | Média | RLS bem implementado + garantia LGPD |
| **OpenAI API lenta/cara** | Média | Média | Cache de respostas comuns, rate limiting |
| **N8N self-hosted instável** | Baixa | Alta | Monitoring + alertas + backup para N8N Cloud |
| **Clínica não paga após beta** | Média | Alta | Contrato de beta com cláusula de resultados mensuráveis |
| **LGPD compliance issue** | Baixa | Muito Alta | Auditoria desde MVP, soft delete, consent explícito |

---

## 📝 Next Steps (Immediate)

### 1. PM Handoff
- [ ] @pm (Morgan) recebe este brief
- [ ] Criar PRD detalhado (Product Requirements Document)
- [ ] Definir User Stories (formato Jira/Linear)
- [ ] Criar roadmap técnico (sprints de 1 semana)

### 2. Architecture Handoff
- [ ] @architect (Sage) recebe PRD
- [ ] Criar diagramas técnicos (sistema, database, fluxos N8N)
- [ ] Definir ADRs (Architecture Decision Records)
- [ ] Validar tech stack

### 3. Dev Handoff
- [ ] @dev (Forge) recebe PRD + arquitetura
- [ ] Setup ambiente de desenvolvimento
- [ ] Iniciar Phase 1 (Foundation)

---

## 📚 Appendices

### A. Research Documents (Source)
1. `Cliente-Oculto-em-Clínicas-TEA.md` - Mystery Shopper Analysis
2. `Dores-Clínicas-TEA.md` - Operational Pain Points Research
3. `O-que-é-Infraestrutura-de-IA.md` - Vertical AI Infrastructure Concept

### B. Deep Dive Documents (Created)
1. `brainstorming_session.md` - Initial ideation session
2. `mvp_deep_dive.md` - Technical deep dive (N8N, database, architecture)
3. `telas_adicionais.md` - Comprehensive screen specifications

### C. Glossary
- **ABA**: Applied Behavior Analysis (metodologia de intervenção para TEA)
- **TEA**: Transtorno do Espectro Autista
- **TISS**: Troca de Informações de Saúde Suplementar (padrão de faturamento médico)
- **Glosa**: Negativa de pagamento de guia médica por operadora de saúde
- **No-Show**: Paciente agendado que não comparece
- **RLS**: Row-Level Security (PostgreSQL)
- **SPIN Selling**: Situation, Problem, Implication, Need-Payoff (metodologia de vendas)
- **Lívia**: Nome do agente de IA de WhatsApp

---

**Document Status**: ✅ Ready for PM Review  
**Prepared by**: Atlas (Business Analyst)  
**Approved by**: Gabriel (Founder) - Pending  
**Next Milestone**: PRD Creation (PM)

— Atlas, investigando a verdade 🔎
