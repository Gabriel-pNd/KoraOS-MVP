# KoraOS MVP Deep Dive - Refinamento de Escopo

**Data**: 2026-02-07  
**Fase**: Deep Dive pós-feedback inicial  
**Foco**: Web App Architecture + Match-Making Agent + Lead/Patient Management

---

## 📋 Decisões Arquiteturais Confirmadas

### ✅ Decisões Técnicas Finalizadas:
1. **Multitenant**: Row-Level Security (RLS) desde o dia 1
2. **Frontend**: Web responsive (não mobile app nativo no MVP)
3. **N8N**: Self-hosted
4. **WhatsApp**: Uazapi (não-oficial) → migrar para API oficial futuramente
5. **Database**: PostgreSQL com RLS (Supabase)
6. **Onboarding**: White-glove (Gabriel configura manualmente)

### ✅ Estratégia de Go-to-Market:
- **Pricing**: Personalizado baseado em ROI (mais receita, menos despesa, mais margem)
- **MVP**: Beta gratuita para captar primeiros resultados
- **Portal dos Pais**: FORA do MVP (v1.1+)
- **Auditoria TISS/Glosas**: FORA do MVP

---

## 🎯 MVP Redefinido: "Two-Legged Stool"

### Perna 1: **Lívia - Agente de Atendimento WhatsApp (RICE: 13.5)**
Mantida do brainstorming original.

### Perna 2: **Sistema de Agendamento Inteligente + Match-Making (RICE: 12.6+)**
**NOVA PROPOSTA EXPANDIDA**

---

## 🤖 Categoria B Atualizada: N8N Agents

### Agentes Confirmados para MVP:

#### **1. Lívia - Agente de Atendimento WhatsApp**
**Responsabilidades**:
- Atendimento 24/7 via Uazapi
- Aplicação de SPIN Selling (anti-Price Dumping)
- Triagem de leads: Nome, Idade da Criança, Laudo/Diagnóstico, Disponibilidade
- Respostas empáticas (sem protocolos numéricos)
- Apenas texto (nunca áudio)

**Fluxos N8N**:
1. **Webhook de entrada** (Uazapi → N8N)
2. **Classificação de intenção** (OpenAI API)
3. **Consulta ao database** (lead existente?)
4. **Geração de resposta** (OpenAI com prompt SPIN)
5. **Envio via Uazapi**
6. **Persistência** (salvar conversa no Supabase)

**Entidades no Database**:
- `leads` (prospects ainda não convertidos)
- `conversations` (histórico WhatsApp)
- `conversation_messages` (mensagens individuais)

---

#### **2. Agente de Confirmação Automática**
**Responsabilidades**:
- Enviar confirmação 24h antes do agendamento via WhatsApp
- Detectar padrão de No-Show (histórico do paciente)
- Marcar pacientes "risk" para follow-up manual

**Fluxos N8N**:
1. **Cron job** (roda 1x/dia às 8h)
2. **Query**: agendamentos nas próximas 24h
3. **Loop**: para cada agendamento
4. **Envio de mensagem** via Uazapi: "Oi [Nome Mãe], confirmando sessão de [Criança] amanhã às [Hora] com [Terapeuta]. Responda SIM para confirmar."
5. **Webhook de resposta** (captura SIM/NÃO)
6. **Update no database**: status do agendamento

**Entidades no Database**:
- `appointments` (campo: `confirmation_status: pending|confirmed|cancelled`)
- `patients` (campo: `no_show_count`, `risk_level`)

---

#### **3. 🆕 Agente de Agendamento Inteligente (SIMPLIFICADO)**

**Problema que resolve**:
Pacientes com múltiplas terapias (ABA + Fono + TO) precisam ir à clínica vários dias/semana, causando:
- Desgaste logístico para a família
- Maior chance de faltas
- Complexidade de coordenação

**Solução**: Agendar múltiplos terapeutas no MESMO DIA, em sequência (ex: 14h Fono, 16h ABA).

### **Lógica de Agendamento Otimizado**:

**Cenário Ideal** (Prioridade 1):
- Paciente precisa de: ABA (2x/semana) + Fono (1x/semana)
- Sistema tenta alocar: Terça 14h Fono + 16h ABA, Quinta 14h ABA
- **Benefício**: Família vai 2x/semana, não 3x

**Cenário Fallback** (Prioridade 2):
- Se não há disponibilidade sequencial, agenda em dias diferentes
- Sistema sugere horários mais próximos possível

### **Fluxo N8N Modular**:

**Módulo 1: `checkTherapistAvailability`**
- Input: `therapist_id`, `date`, `time_slot`
- Output: `available: true/false`
- Query: `SELECT * FROM appointments WHERE therapist_id = X AND scheduled_at = Y`

**Módulo 2: `findSequentialSlots`**
- Input: `therapy_types[]`, `preferred_days[]`, `duration_per_therapy`
- Logic:
  1. Para cada dia preferido:
  2. Para cada terapeuta por especialidade:
  3. Verificar se há 2+ slots consecutivos vagos
  4. Retornar combinações possíveis
- Output: Array de opções `[{day: 'Terça', slots: ['14h Fono (Dra.Ana)', '16h ABA (Dr.João)']}]`

**Módulo 3: `createAppointmentSeries`**
- Input: `patient_id`, `therapist_schedule[]`, `recurrence_weeks`
- Logic: Criar N agendamentos (ex: 12 semanas)
- Output: Array de `appointment_ids`

**Módulo 4: `cancelAppointmentBatch`** (NOVO)
- Input: `patient_id` ou `therapist_id`, `date_range`, `reason`
- Logic:
  1. Query appointments no range
  2. Update status = 'cancelled'
  3. Criar registro de auditoria
  4. Notificar afetados via WhatsApp
- Output: `cancelled_count`, `affected_users[]`

**Módulo 5: `rescheduleAppointment`** (NOVO)
- Input: `appointment_id`, `new_date`, `new_therapist_id` (opcional)
- Logic:
  1. Verificar disponibilidade do novo slot
  2. Update appointment
  3. Criar registro de auditoria (quem mudou, quando, motivo)
  4. Notificar paciente + terapeuta
- Output: `updated_appointment`

**Princípio de Modularização N8N**:
- Cada módulo = 1 workflow separado
- Comunicação via HTTP Request entre workflows
- Evita "megazords" de 100+ nós
- Facilita debug e manutenção

**Entidades no Database** (simplificadas):
```sql
CREATE TABLE therapists (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  name TEXT,
  specialties TEXT[], -- ['ABA', 'Fono']
  availability_json JSONB -- grid semanal
);
```

---

## 🖥️ Web App: Arquitetura e Módulos

### **Objetivo**: Visualização e Gestão da Infraestrutura

Você mencionou que precisa **mergulhar mais fundo no Web App**. Vamos detalhar as telas e funcionalidades críticas.

---

## 🔒 Auditoria e Não-Repúdio (Desde o MVP)

**Princípio**: Toda alteração/deleção é rastreável e irreversível.

### **Implementação**:

#### **Soft Delete** (nunca deletar fisicamente)
```sql
ALTER TABLE appointments ADD COLUMN deleted_at TIMESTAMP;
ALTER TABLE appointments ADD COLUMN deleted_by UUID REFERENCES users(id);
ALTER TABLE patients ADD COLUMN deleted_at TIMESTAMP;
ALTER TABLE patients ADD COLUMN deleted_by UUID REFERENCES users(id);

-- Queries sempre filtram deleted_at IS NULL
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

-- Índice para consultas rápidas
CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_user ON audit_log(user_id);
```

#### **Trigger Automático** (PostgreSQL)
```sql
-- Exemplo para appointments
CREATE OR REPLACE FUNCTION log_appointment_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (tenant_id, user_id, action, entity_type, entity_id, changes)
  VALUES (
    NEW.tenant_id,
    current_setting('app.current_user_id')::UUID,
    TG_OP, -- 'INSERT', 'UPDATE', 'DELETE'
    'appointment',
    NEW.id,
    jsonb_build_object('before', row_to_json(OLD), 'after', row_to_json(NEW))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER appointment_audit
AFTER INSERT OR UPDATE OR DELETE ON appointments
FOR EACH ROW EXECUTE FUNCTION log_appointment_changes();
```

#### **UI de Auditoria** (Web App):
- Tela: "Histórico de Alterações" (por entidade)
- Mostra: Quem, Quando, O quê mudou, Antes/Depois
- Somente leitura (imutável)

---

## 👥 Hierarquia de Permissões

### **Super Admin (Gabriel)**
- Acessa QUALQUER tenant (sem RLS)
- Vê todos os dados de todas as clínicas
- Pode criar/editar/deletar qualquer registro
- Acessa logs de auditoria globais

**Implementação**:
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id), -- NULL se super admin
  email TEXT UNIQUE,
  role TEXT, -- 'super_admin', 'admin', 'secretary', 'therapist'
  is_super_admin BOOLEAN DEFAULT false
);

-- RLS bypassa super admin
CREATE POLICY tenant_isolation ON patients
  USING (
    tenant_id = current_setting('app.current_tenant')::UUID
    OR current_setting('app.is_super_admin')::BOOLEAN = true
  );
```

### **Admin/Gestor (por clínica)**
- Vê todos os dados da SUA clínica
- Gerencia usuários (secretária, terapeutas)
- Acessa relatórios financeiros/operacionais
- NÃO vê outras clínicas

### **Secretária/Recepção**
- Vê leads, pacientes, agendamentos
- Pode criar/editar agendamentos
- NÃO vê dados financeiros sensíveis (salários)
- NÃO pode deletar pacientes

### **Terapeuta**
- Vê APENAS seus próprios pacientes
- Pode registrar sessões
- NÃO vê agenda de outros terapeutas
- NÃO vê leads/comercial

---

## 🖥️ Web App: Telas Detalhadas por Persona

### **RECEPÇÃO/SECRETÁRIA**

#### **Tela 1: Home/Inicial - "O que devo fazer agora?"**

**Objetivo**: Priorizar tarefas do dia.

**Widgets**:
1. **🚨 Alertas Urgentes** (topo):
   - "3 confirmações pendentes para hoje"
   - "2 tickets de escalação aguardando resposta"
   - "1 paciente com 2 no-shows (risco)"

2. **📋 Tarefas do Dia**:
   - [ ] Confirmar 5 agendamentos de amanhã
   - [ ] Responder 2 leads novos
   - [ ] Agendar retorno de João (avaliação completa)

3. **📊 Resumo Rápido**:
   - Leads ativos: 12
   - Agendamentos hoje: 8 (6 confirmados, 2 pendentes)
   - Taxa de conversão semana: 35%

**Wireframe**:
```
┌─────────────────────────────────────────┐
│ Bom dia, Maria! ☀️                      │
├─────────────────────────────────────────┤
│ 🚨 ATENÇÃO                              │
│ • 3 confirmações pendentes para HOJE    │
│ • 2 tickets aguardando sua resposta     │
├─────────────────────────────────────────┤
│ 📋 Suas Tarefas                         │
│ ☐ Confirmar agendamentos de amanhã (5)  │
│ ☐ Responder leads novos (2)             │
├─────────────────────────────────────────┤
│ 📊 Resumo                               │
│ Leads: 12  |  Agendamentos hoje: 8     │
└─────────────────────────────────────────┘
```

---

### **Módulo 1: Dashboard Executivo (Gestor)**

**Persona**: Dono da clínica ou gerente

**Diferença vs Recepção**: Foco em ESTRATÉGIA, não operação.

**Métricas Exibidas**:
1. **Funil de Conversão de Leads**:
   - Leads captados (total mês)
   - Leads em conversa (Lívia ativa)
   - Leads agendados (primeira consulta)
   - Leads convertidos (viraram pacientes)
   - Taxa de conversão % (meta: > 30%)

2. **Performance de Agendamentos**:
   - Total de sessões realizadas (mês)
   - Taxa de confirmação (%)
   - Taxa de No-Show (% - meta: < 10%)
   - Comparação mês anterior (crescimento)

3. **Performance de Terapeutas**:
   - Horas faturáveis por terapeuta
   - Taxa de ocupação (% - meta: > 75%)
   - Pacientes ativos por terapeuta
   - Ranking de produtividade

4. **Saúde da Operação**:
   - Pacientes ativos vs inativos
   - Taxa de retenção (pacientes há > 3 meses)
   - Tempo médio de resposta (Lívia + Recepção)

5. **Alertas Estratégicos**:
   - 🔴 Terapeutas com baixa ocupação (< 70%)
   - 🟡 Leads sem follow-up há > 5 dias
   - 🔴 Taxa de no-show acima da meta (> 10%)

**Wireframe Conceitual**:
```
┌─────────────────────────────────────────────────┐
│ KoraOS - Dashboard Executivo          [Mês ▼]  │
├─────────────────────────────────────────────────┤
│ 📊 Funil de Leads             📅 Agendamentos   │
│ ┌─────┐ ┌─────┐ ┌─────┐      ┌──────────────┐  │
│ │ 120 │→│ 80  │→│ 45  │      │ Taxa Confirm │  │
│ └─────┘ └─────┘ └─────┘      │   85% ✅     │  │
│ Captados Conversa Agendados  │ No-Show      │  │
│ Conv: 37% ✅                  │   8%  ✅     │  │
│                               └──────────────┘  │
├─────────────────────────────────────────────────┤
│ 👥 Performance Terapeutas                       │
│ Dr. João:  32h/sem (80% ocupação) ✅            │
│ Dra. Ana:  28h/sem (70% ocupação) ⚠️            │
├─────────────────────────────────────────────────┤
│ 🚨 Alertas                                      │
│ • Dra. Ana abaixo da meta de ocupação           │
│ • 5 leads sem follow-up há > 5 dias             │
└─────────────────────────────────────────────────┘
```

---

### **Módulo 2: Gestão de Leads (Secretária)**

**Persona**: Recepcionista/Secretária

**Funcionalidades**:

#### **Tela 2.1: Lista de Leads**
- Tabela com status: `novo`, `em_conversa`, `agendado`, `perdido`
- Filtros: Origem (WhatsApp, Indicação, Site), Data de criação
- Ações rápidas: Ver conversa, Agendar manualmente, Marcar como perdido

**Campos da Tabela**:
| Nome do Responsável | Nome da Criança | Idade | Laudo | Status | Última Interação | Ações |
|---------------------|-----------------|-------|-------|--------|------------------|-------|
| Maria Silva | João | 4 anos | TEA Nível 2 | Em conversa | Hoje, 10:32 | [Ver] [Agendar] |

#### **Tela 2.2: Detalhes do Lead**
- Histórico completo da conversa com Lívia (WhatsApp)
- Dados triados: Nome, Telefone, Idade, Laudo, Disponibilidade
- Botão: "Converter em Paciente" (cria registro em `patients`)
- Botão: "Agendar Avaliação" (trigger match-making)

---

### **Módulo 3: Agenda Inteligente (Secretária + Terapeuta)**

**Persona**: Secretária (visão geral) + Terapeuta (visão individual)

#### **Tela 3.1: Calendário Geral (Secretária)**
- Visão semanal/mensal
- Cores por terapeuta
- Indicador visual de "buracos" (horários vagos)
- Clique para criar agendamento → trigger match-making

**Wireframe**:
```
┌──────────────────────────────────────────────┐
│ Agenda Geral - Semana 10/02 - 16/02         │
├──────┬───────────┬───────────┬────────────┬──┤
│      │ Segunda   │ Terça     │ Quarta     │  │
├──────┼───────────┼───────────┼────────────┼──┤
│ 08:00│ [Dr.João] │ [Dra.Ana] │            │  │
│      │ Maria (4) │ Pedro (6) │   VAGA 🟡  │  │
├──────┼───────────┼───────────┼────────────┼──┤
│ 10:00│ [Dr.João] │           │ [Dr.João]  │  │
│      │ Lucas (5) │  VAGA 🟡  │ Júlia (3)  │  │
└──────┴───────────┴───────────┴────────────┴──┘
```

#### **Tela 3.2: Confirmações Pendentes**
- Lista de agendamentos nas próximas 48h
- Status: `confirmado` ✅, `pendente` ⏳, `cancelado` ❌
- Botão: "Reenviar confirmação" (trigger manual do agente)

---

### **Módulo 4: Gestão de Pacientes**

**Persona**: Secretária + Terapeuta

#### **Tela 4.1: Lista de Pacientes Ativos**
**Campos**:
| Nome | Idade | Responsável | Terapias | Terapeuta Principal | No-Shows | Último Atendimento |
|------|-------|-------------|----------|---------------------|----------|-------------------|
| João | 4 anos | Maria Silva | ABA, Fono | Dr. João | 1 | 05/02/2026 |

**Filtros**: Terapeuta, Tipo de terapia, Status (ativo/inativo)

#### **Tela 4.2: Perfil do Paciente**

**Seções**:
1. **Dados Cadastrais**:
   - Nome, Data de Nascimento, Telefone dos Responsáveis
   - Laudo/Diagnóstico (upload PDF)
   - Plano de Saúde (se tiver)

2. **Histórico de Sessões**:
   - Tabela: Data, Terapeuta, Tipo de Terapia, Status (realizada/falta)
   - Gráfico de frequência (últimos 30 dias)

3. **Agendamentos Futuros**:
   - Lista das próximas sessões
   - Botão: "Reagendar"

4. **Evolução Clínica** (simplificada para MVP):
   - Timeline de marcos: "Primeira palavra", "Contato visual estabelecido"
   - Upload de relatórios PDF (supervisor)

---

### **Módulo 5: Gestão de Terapeutas (Admin)**

**Persona**: Gestor/Admin

#### **Tela 5.1: Lista de Terapeutas**
**Campos**:
| Nome | Especialidades | Pacientes Ativos | Horas/Semana | Ocupação | Disponibilidade |
|------|----------------|------------------|--------------|----------|----------------|
| Dr. João | ABA, TO | 12 | 32h | 80% | [Editar] |

#### **Tela 5.2: Perfil do Terapeuta**
- Dados cadastrais (CRP/CRFa, experiência)
- Especialidades (checkboxes: ABA, Fono, TO, Psico)
- Faixa etária de atuação (2-12 anos)
- **Editor de Disponibilidade**:
  - Grid semanal (Segunda a Sábado, 8h às 18h)
  - Clique para marcar/desmarcar slots de 1h
  - Salvo em `availability_json`

**Wireframe - Editor de Disponibilidade**:
```
┌────────────────────────────────────────┐
│ Disponibilidade - Dr. João            │
├──────┬───┬───┬───┬───┬───┬───┬───────┤
│ Hora │Seg│Ter│Qua│Qui│Sex│Sáb│ Ações │
├──────┼───┼───┼───┼───┼───┼───┼───────┤
│ 08:00│ ✅│ ✅│ ✅│ ✅│ ✅│   │       │
│ 09:00│ ✅│ ✅│ ✅│ ✅│ ✅│   │       │
│ 10:00│   │ ✅│   │ ✅│ ✅│   │       │
│ ...  │   │   │   │   │   │   │       │
└──────┴───┴───┴───┴───┴───┴───┴───────┘
[Salvar Disponibilidade]
```

---

## 💾 Subcategoria C: Database Schema Refinado

### **Entidades Core do MVP** (focadas em Lead → Paciente → Agendamento)

```sql
-- MULTITENANT
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- "Clínica ABC"
  slug TEXT UNIQUE, -- "clinica-abc"
  created_at TIMESTAMP DEFAULT NOW()
);

-- USUÁRIOS (Admin, Secretária, Terapeuta)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  email TEXT UNIQUE,
  role TEXT, -- 'admin', 'secretary', 'therapist'
  name TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- TERAPEUTAS (extensão de users)
CREATE TABLE therapists (
  id UUID PRIMARY KEY REFERENCES users(id),
  tenant_id UUID REFERENCES tenants(id),
  specialties TEXT[], -- ['ABA', 'Fono', 'TO']
  experience_years INT,
  age_range_min INT,
  age_range_max INT,
  availability_json JSONB, -- grid de disponibilidade
  home_care_enabled BOOLEAN DEFAULT false
);

-- LEADS (prospects)
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  parent_name TEXT,
  phone TEXT,
  child_name TEXT,
  child_age INT,
  diagnosis TEXT, -- "TEA Nível 2"
  availability_notes TEXT, -- "Terça e Quinta de manhã"
  status TEXT, -- 'novo', 'em_conversa', 'agendado', 'convertido', 'perdido'
  source TEXT, -- 'whatsapp', 'indicacao', 'site'
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

-- PACIENTES (convertidos)
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  lead_id UUID REFERENCES leads(id), -- origem
  name TEXT,
  birth_date DATE,
  diagnosis TEXT,
  parent_name TEXT,
  parent_phone TEXT,
  health_insurance TEXT, -- plano de saúde
  no_show_count INT DEFAULT 0,
  risk_level TEXT, -- 'low', 'medium', 'high'
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
  duration_minutes INT DEFAULT 120, -- sessão de 2h padrão
  location TEXT, -- 'clinic' ou 'home'
  status TEXT, -- 'scheduled', 'confirmed', 'completed', 'no_show', 'cancelled'
  confirmation_status TEXT, -- 'pending', 'confirmed'
  confirmation_sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- SESSÕES (registro pós-atendimento)
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  appointment_id UUID REFERENCES appointments(id),
  patient_id UUID REFERENCES patients(id),
  therapist_id UUID REFERENCES therapists(id),
  notes TEXT, -- observações do terapeuta
  occurred_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- MATCH SCORES (para ML futuro)
CREATE TABLE match_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  therapist_id UUID REFERENCES therapists(id),
  patient_id UUID REFERENCES patients(id),
  score FLOAT,
  factors JSONB, -- {"disponibilidade": 0.9, "experiencia": 0.8}
  created_at TIMESTAMP DEFAULT NOW()
);
```

### **Row-Level Security (RLS) Policies**

```sql
-- Exemplo para tabela patients
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_policy ON patients
  USING (tenant_id = current_setting('app.current_tenant')::UUID);

-- No app (Next.js), antes de cada query:
-- SET app.current_tenant = 'uuid-da-clinica';
```

---

## 🔄 Fluxo Completo: Lead → Paciente → Agendamento

### **Jornada do Usuário**:

1. **Lead entra via WhatsApp** (Lívia captura dados)
   - Criado registro em `leads` (status: `novo`)
   - Criado `conversation` + `conversation_messages`

2. **Lívia agenda avaliação** (ou secretária faz manualmente)
   - Status do lead: `em_conversa` → `agendado`
   - Trigger **Agente de Match-Making**:
     - Retorna 3 terapeutas sugeridos
     - Secretária escolhe via Web App
     - Criado `appointment` (status: `scheduled`)

3. **24h antes: Confirmação automática**
   - **Agente de Confirmação** envia WhatsApp
   - Lead responde "SIM"
   - Update: `confirmation_status: confirmed`

4. **Dia da sessão: Check-in**
   - Terapeuta marca presença (Web App ou futuro app mobile)
   - Status: `scheduled` → `completed`
   - Criado `session` com notas

5. **Conversão de Lead → Paciente**
   - Após primeira sessão, secretária clica "Converter"
   - Criado registro em `patients`
   - Status do lead: `convertido`

---

## 🎨 Design System do Web App

### **Componentes UI Críticos**:

1. **LeadCard** (componente reutilizável)
   - Mostra: Nome, Telefone, Status badge, Última interação
   - Ações: Ver detalhes, Agendar, Marcar como perdido

2. **AppointmentCard**
   - Mostra: Paciente, Terapeuta, Data/Hora, Status
   - Badge de confirmação: ✅ Confirmado / ⏳ Pendente / ❌ Cancelado

3. **TherapistAvailabilityGrid**
   - Grid interativo (clique para toggle disponibilidade)
   - Salva em `availability_json`

4. **ConfirmationStatusBadge**
   - Verde: Confirmado
   - Amarelo: Pendente
   - Vermelho: Não compareceu

---

## 🧪 Perguntas para Aprofundar

### **Sobre Web App**:
1. **Prioridade de desenvolvimento**: Qual módulo você quer ver primeiro?
   - [ ] Dashboard Executivo (métricas)
   - [ ] Gestão de Leads (tabela + detalhes)
   - [ ] Agenda Inteligente (calendário)
   - [ ] Gestão de Pacientes

2. **Níveis de permissão**: Como funcionam?
   - Admin vê tudo?
   - Secretária vê só leads + agendamentos?
   - Terapeuta vê só seus próprios pacientes?

3. **Onboarding de clínica**: O que você configura manualmente?
   - Cadastro de terapeutas?
   - Importação de pacientes existentes?
   - Configuração de horários da clínica?

### **Sobre Match-Making**:
4. **Regras de negócio**: Quais são OBRIGATÓRIAS vs OPCIONAIS?
   - Terapeuta DEVE ter a especialidade? (obrigatório)
   - Terapeuta DEVE estar disponível no horário? (obrigatório)
   - Preferência geográfica? (opcional)

5. **Override manual**: Secretária pode ignorar sugestão da IA?
   - Ou a IA só sugere mas secretária decide sempre?

6. **Recorrência de agendamentos**: 
   - Criar 1 agendamento ou série (ex: toda terça por 3 meses)?

### **Sobre N8N Flows**:
7. **Prioridade de desenvolvimento**:
   - [ ] Lívia (WhatsApp)
   - [ ] Confirmação Automática
   - [ ] Match-Making

8. **Integração com Uazapi**:
   - Você já tem conta/API key?
   - Precisamos testar primeiro?

---

## 📦 Proposta de MVP Refinado (Checklist de Features)

### **Epic 1: Infraestrutura Base**
- [ ] Setup Supabase (database + auth)
- [ ] Setup N8N self-hosted
- [ ] Setup Next.js + Shadcn UI
- [ ] Configuração de RLS policies
- [ ] Schema do database (todas as tabelas acima)
- [ ] Seed data (1 tenant de teste)

### **Epic 2: Lívia (Agente WhatsApp)**
- [ ] Integração Uazapi ↔ N8N (webhook)
- [ ] Flow: Receber mensagem → Classificar intenção
- [ ] Flow: Gerar resposta (OpenAI) → Enviar via Uazapi
- [ ] Persistência de conversas no Supabase
- [ ] Script SPIN Selling (prompts OpenAI)
- [ ] Criação automática de leads

### **Epic 3: Web App - Gestão de Leads**
- [ ] Tela: Lista de leads (tabela com filtros)
- [ ] Tela: Detalhes do lead (conversa + dados)
- [ ] Ação: Converter lead → paciente
- [ ] Ação: Marcar como perdido

### **Epic 4: Web App - Agendamentos**
- [ ] Tela: Calendário geral (visão semanal)
- [ ] Cadastro de terapeutas (+ disponibilidade)
- [ ] Agente Match-Making (N8N flow)
- [ ] UI: Sugestões de terapeutas ranqueadas
- [ ] Criação de agendamento (single + recorrente)

### **Epic 5: Confirmação Automática**
- [ ] N8N: Cron job (query agendamentos próximos)
- [ ] N8N: Envio de confirmação via Uazapi
- [ ] Webhook: Captura resposta (SIM/NÃO)
- [ ] Update de status no database
- [ ] Tela: Lista de confirmações pendentes (secretária)

### **Epic 6: Dashboard Executivo**
- [ ] Métricas: Funil de leads
- [ ] Métricas: Performance de agendamentos
- [ ] Alertas: No-shows recorrentes
- [ ] Alertas: Terapeutas com baixa ocupação

---

## 🎯 Próximo Passo Imediato

**O que você precisa decidir agora**:

1. **Qual Epic começar primeiro?** (sugiro Epic 1 + 2: Infra + Lívia)
2. **Respostas às perguntas de Web App** (prioridade de módulos)
3. **Validar schema do database** (falta alguma entidade?)

Com suas respostas, atualizo o brainstorming final e crio o **Project Brief** para handoff ao @pm.

— Atlas, investigando a verdade 🔎
