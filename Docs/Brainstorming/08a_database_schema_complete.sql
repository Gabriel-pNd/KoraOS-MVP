-- ============================================================
-- KoraOS MVP - Database Schema Complete v3.2
-- ============================================================
-- Data: 2026-02-08
-- Versão: 3.2 (Inclui 19 Blind Spots)
-- ============================================================

-- ============================================================
-- EXTENSÕES NECESSÁRIAS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS btree_gist;  -- Para EXCLUDE constraints
CREATE EXTENSION IF NOT EXISTS pg_cron;      -- Para jobs agendados

-- ============================================================
-- 1. TENANTS (Multitenancy Root)
-- ============================================================
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  address JSONB,
  city TEXT,
  state TEXT,
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  
  -- Timezone (Blind Spot #15)
  timezone TEXT DEFAULT 'America/Sao_Paulo',
  
  -- Queue limits (Blind Spot #19)
  max_queue_size INT DEFAULT 1000,
  queue_alert_threshold INT DEFAULT 800,
  
  onboarding_completed BOOLEAN DEFAULT false,
  subscription_tier TEXT DEFAULT 'free',
  created_at TIMESTAMP DEFAULT NOW(),
  active BOOLEAN DEFAULT true
);

-- ============================================================
-- 2. USERS (Autenticação e Perfis)
-- ============================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  
  role TEXT NOT NULL,
  is_super_admin BOOLEAN DEFAULT false,
  is_system BOOLEAN DEFAULT false,
  
  permissions JSONB DEFAULT '{}',
  
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  active BOOLEAN DEFAULT true
);

CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);

-- System Users (Seed)
INSERT INTO users (id, email, name, role, is_system) VALUES
  ('00000000-0000-0000-0000-000000000001', 'system@kora.ai', 'Sistema', 'system', true),
  ('00000000-0000-0000-0000-000000000002', 'ia@kora.ai', 'IA (Lívia)', 'system', true);

-- ============================================================
-- 3. CONTACTS (Centro do Modelo de Dados)
-- ============================================================
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  phone TEXT NOT NULL,
  name TEXT,
  email TEXT,
  relationship_type TEXT,
  notes TEXT,
  
  consent_given_at TIMESTAMP,
  consent_ip TEXT,
  consent_user_agent TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(tenant_id, phone)
);

CREATE INDEX idx_contacts_phone ON contacts(tenant_id, phone);
CREATE INDEX idx_contacts_tenant ON contacts(tenant_id);

-- ============================================================
-- 4. PATIENTS (Pacientes Ativos)
-- ============================================================
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  birth_date DATE,
  age INT GENERATED ALWAYS AS (
    CASE 
      WHEN birth_date IS NOT NULL THEN EXTRACT(YEAR FROM AGE(birth_date))::INT
      ELSE NULL
    END
  ) STORED,
  gender TEXT,
  
  diagnosis TEXT,
  diagnosis_date DATE,
  diagnosis_documents TEXT[],
  medical_notes TEXT,
  
  payment_method TEXT,
  insurance_name TEXT,
  insurance_number TEXT,
  insurance_card_image TEXT,
  
  status TEXT DEFAULT 'active',
  discharge_reason TEXT,
  discharge_date DATE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  converted_from_lead_id UUID,
  
  deleted_at TIMESTAMP,
  deleted_by UUID REFERENCES users(id),
  
  -- Blind Spot #16: Reativação tracking
  reactivated_at TIMESTAMP,
  reactivation_count INT DEFAULT 0
);

CREATE INDEX idx_patients_contact ON patients(contact_id);
CREATE INDEX idx_patients_tenant_status ON patients(tenant_id, status);
CREATE INDEX idx_patients_deleted ON patients(deleted_at) WHERE deleted_at IS NOT NULL;

-- ============================================================
-- 4b. PATIENT_GUARDIANS (Blind Spot #1 - Guarda Compartilhada)
-- ============================================================
CREATE TABLE patient_guardians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  
  relationship TEXT NOT NULL, -- 'mother', 'father', 'guardian', 'grandparent'
  is_primary BOOLEAN DEFAULT false,
  
  -- Permissões granulares
  can_schedule BOOLEAN DEFAULT true,
  can_cancel BOOLEAN DEFAULT true,
  can_view_medical BOOLEAN DEFAULT false,
  can_receive_updates BOOLEAN DEFAULT true,
  
  -- Validação
  verified_at TIMESTAMP,
  verified_by UUID REFERENCES users(id),
  verification_method TEXT, -- 'document', 'in_person', 'secretary_call'
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(patient_id, contact_id)
);

CREATE INDEX idx_guardians_patient ON patient_guardians(patient_id);
CREATE INDEX idx_guardians_contact ON patient_guardians(contact_id);

-- ============================================================
-- 5. LEADS (Pipeline Comercial)
-- ============================================================
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  
  child_name TEXT,
  child_age INT,
  child_diagnosis_notes TEXT,
  
  status TEXT NOT NULL DEFAULT 'novo',
  status_changed_at TIMESTAMP DEFAULT NOW(),
  source TEXT,
  
  preferred_days TEXT[],
  preferred_periods TEXT[],
  availability_notes TEXT,
  
  payment_preference TEXT,
  insurance_preference TEXT,
  
  last_interaction_at TIMESTAMP DEFAULT NOW(),
  followup_stage INT DEFAULT 0,
  last_followup_at TIMESTAMP,
  next_followup_at TIMESTAMP,
  
  -- Human Takeover com Escalation (Blind Spot #9)
  human_takeover BOOLEAN DEFAULT false,
  human_takeover_at TIMESTAMP,
  human_takeover_reason TEXT,
  human_takeover_by UUID REFERENCES users(id),
  human_takeover_deadline TIMESTAMP,
  escalation_level INT DEFAULT 0, -- 0=normal, 1=secretary, 2=manager, 3=auto
  
  comprehension_failure_count INT DEFAULT 0,
  
  converted_at TIMESTAMP,
  converted_to_patient_id UUID REFERENCES patients(id),
  lost_reason TEXT,
  lost_at TIMESTAMP,
  
  success_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  deleted_at TIMESTAMP,
  deleted_by UUID REFERENCES users(id),
  
  -- Blind Spot #16: Reativação tracking
  reactivated_at TIMESTAMP,
  reactivation_count INT DEFAULT 0
);

CREATE INDEX idx_leads_tenant_status ON leads(tenant_id, status);
CREATE INDEX idx_leads_contact ON leads(contact_id);
CREATE INDEX idx_leads_followup ON leads(tenant_id, status, next_followup_at) 
  WHERE status = 'follow_up' AND human_takeover = false;
CREATE INDEX idx_leads_deleted ON leads(deleted_at) WHERE deleted_at IS NOT NULL;
-- Blind Spot #9: Index para deadlines
CREATE INDEX idx_leads_takeover_deadline ON leads(human_takeover_deadline) 
  WHERE human_takeover = true AND human_takeover_deadline IS NOT NULL;

-- ============================================================
-- 6. CONVERSATIONS + MESSAGES
-- ============================================================
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  
  platform TEXT DEFAULT 'whatsapp',
  external_id TEXT,
  status TEXT DEFAULT 'active',
  
  -- Blind Spot #4: Versionamento para tool call stale
  version INT DEFAULT 1,
  
  created_at TIMESTAMP DEFAULT NOW(),
  last_message_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_conversations_contact ON conversations(contact_id);
CREATE INDEX idx_conversations_tenant ON conversations(tenant_id);

CREATE TABLE conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  
  sender TEXT NOT NULL,
  sender_user_id UUID REFERENCES users(id),
  
  message_type TEXT DEFAULT 'text',
  message_text TEXT,
  
  original_media_url TEXT,
  stored_media_path TEXT,
  media_mime_type TEXT,
  media_size_bytes INT,
  
  transcription TEXT,
  transcription_confidence FLOAT,
  vision_analysis TEXT,
  vision_confidence FLOAT,
  
  is_from_me BOOLEAN DEFAULT false,
  external_id TEXT,
  
  sent_at TIMESTAMP DEFAULT NOW(),
  delivered_at TIMESTAMP,
  read_at TIMESTAMP,
  failed_at TIMESTAMP,
  failure_reason TEXT,
  
  -- Blind Spot #10: Mensagem revogada
  deleted_at TIMESTAMP,
  revoked_by_user BOOLEAN DEFAULT false
);

CREATE INDEX idx_messages_conversation ON conversation_messages(conversation_id, sent_at);
CREATE INDEX idx_messages_external ON conversation_messages(external_id);

-- Blind Spot #4: Trigger para incrementar version
CREATE OR REPLACE FUNCTION increment_conversation_version()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations 
  SET version = version + 1,
      last_message_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_message_version
AFTER INSERT ON conversation_messages
FOR EACH ROW EXECUTE FUNCTION increment_conversation_version();

-- ============================================================
-- 7. THERAPISTS + EXCEPTIONS
-- ============================================================
CREATE TABLE therapists (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  full_name TEXT NOT NULL,
  professional_bio TEXT,
  profile_photo TEXT,
  
  specialties JSONB NOT NULL DEFAULT '[]',
  
  availability_json JSONB,
  session_duration_minutes INT DEFAULT 60,
  
  max_daily_sessions INT,
  max_weekly_sessions INT,
  
  active BOOLEAN DEFAULT true,
  hired_at DATE,
  terminated_at DATE,
  termination_reason TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_therapists_tenant ON therapists(tenant_id);
CREATE INDEX idx_therapists_active ON therapists(tenant_id, active) WHERE active = true;

CREATE TABLE therapist_exceptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id UUID REFERENCES therapists(id) ON DELETE CASCADE,
  
  date DATE NOT NULL,
  type TEXT NOT NULL,
  reason TEXT,
  
  unavailable_slots TEXT[],
  extra_slots TEXT[],
  
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

CREATE INDEX idx_therapist_exceptions_date ON therapist_exceptions(therapist_id, date);

-- ============================================================
-- 8. APPOINTMENTS (com Anti-Overbooking)
-- ============================================================
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  therapist_id UUID REFERENCES therapists(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES contacts(id),
  
  scheduled_at TIMESTAMP NOT NULL,
  duration_minutes INT DEFAULT 60,
  therapy_type TEXT NOT NULL,
  room TEXT,
  
  status TEXT DEFAULT 'scheduled',
  
  confirmation_status TEXT DEFAULT 'pending',
  confirmation_sent_at TIMESTAMP,
  confirmation_received_at TIMESTAMP,
  confirmation_method TEXT,
  
  -- Blind Spot #7: Two-phase commit
  confirmation_message_status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'retrying'
  confirmation_retry_count INT DEFAULT 0,
  confirmation_last_error TEXT,
  
  created_by_source TEXT,
  created_by_user_id UUID REFERENCES users(id),
  confirmed_by_contact BOOLEAN DEFAULT false,
  
  last_modified_at TIMESTAMP DEFAULT NOW(),
  last_modified_by UUID REFERENCES users(id),
  modification_reason TEXT,
  
  cancelled_at TIMESTAMP,
  cancel_reason TEXT,
  cancelled_by UUID REFERENCES users(id),
  
  completed_at TIMESTAMP,
  no_show_at TIMESTAMP,
  no_show_reason TEXT,
  
  notes TEXT,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_appointments_patient ON appointments(patient_id, scheduled_at);
CREATE INDEX idx_appointments_therapist ON appointments(therapist_id, scheduled_at);
CREATE INDEX idx_appointments_tenant_date ON appointments(tenant_id, scheduled_at);
CREATE INDEX idx_appointments_confirmation ON appointments(confirmation_status, confirmation_sent_at)
  WHERE status = 'scheduled' AND confirmation_status = 'pending';
CREATE INDEX idx_appointments_contact ON appointments(contact_id, scheduled_at);
-- Blind Spot #7: Index para órfãos
CREATE INDEX idx_appointments_orphan ON appointments(created_at, confirmation_message_status)
  WHERE status = 'pending_confirmation' AND confirmation_retry_count < 3;

-- Blind Spot #6: Constraint de exclusão para prevenir overbooking
ALTER TABLE appointments ADD CONSTRAINT no_double_booking
EXCLUDE USING GIST (
  therapist_id WITH =,
  tsrange(scheduled_at, scheduled_at + (duration_minutes || ' minutes')::interval) WITH &&
)
WHERE (status NOT IN ('cancelled', 'no_show'));

-- ============================================================
-- 9. HOLIDAYS
-- ============================================================
CREATE TABLE holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  date DATE NOT NULL,
  name TEXT NOT NULL,
  type TEXT,
  is_clinic_closed BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

CREATE UNIQUE INDEX idx_holidays_date ON holidays(COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000'), date);

-- ============================================================
-- 10. CLINIC_HOURS
-- ============================================================
CREATE TABLE clinic_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  day_of_week INT NOT NULL,
  opens_at TIME,
  closes_at TIME,
  is_closed BOOLEAN DEFAULT false,
  
  UNIQUE(tenant_id, day_of_week)
);

-- ============================================================
-- 11. SUPPORT_TICKETS
-- ============================================================
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  contact_id UUID REFERENCES contacts(id),
  lead_id UUID REFERENCES leads(id),
  patient_id UUID REFERENCES patients(id),
  conversation_id UUID REFERENCES conversations(id),
  appointment_id UUID REFERENCES appointments(id),
  
  type TEXT NOT NULL,
  reason TEXT NOT NULL,
  reason_details TEXT,
  priority TEXT DEFAULT 'normal',
  
  status TEXT DEFAULT 'open',
  assigned_to UUID REFERENCES users(id),
  assigned_at TIMESTAMP,
  
  resolution_notes TEXT,
  return_to_ia BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP,
  resolved_by UUID REFERENCES users(id),
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tickets_tenant_status ON support_tickets(tenant_id, status, priority);
CREATE INDEX idx_tickets_assigned ON support_tickets(assigned_to, status) WHERE status IN ('open', 'in_progress');

-- ============================================================
-- 12. MESSAGE_QUEUE (Anti-Loss + Dedupe)
-- ============================================================
CREATE TABLE message_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  
  platform TEXT DEFAULT 'whatsapp',
  raw_payload JSONB NOT NULL,
  phone TEXT,
  
  -- Blind Spot #13: Dedupe por external_id
  external_id TEXT,
  
  status TEXT DEFAULT 'pending',
  processing_started_at TIMESTAMP,
  processing_completed_at TIMESTAMP,
  processed_by TEXT,
  
  error_message TEXT,
  retry_count INT DEFAULT 0,
  max_retries INT DEFAULT 3,
  
  -- Blind Spot #19: Dead-letter
  dead_letter_reason TEXT,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_queue_status ON message_queue(status, created_at);
CREATE INDEX idx_queue_phone ON message_queue(phone, created_at);
-- Blind Spot #13: Unique constraint para dedupe
CREATE UNIQUE INDEX idx_queue_external_unique 
ON message_queue(tenant_id, external_id) 
WHERE status != 'dead_letter' AND external_id IS NOT NULL;

-- ============================================================
-- 13. AUDIT_LOG (Sanitizado)
-- ============================================================
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  
  user_id UUID REFERENCES users(id),
  action_source TEXT NOT NULL,
  
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  
  -- Blind Spot #3: Changes são sanitizados antes de persistir
  changes JSONB,
  reason TEXT,
  
  requires_password BOOLEAN DEFAULT false,
  password_confirmed BOOLEAN,
  
  ip_address TEXT,
  user_agent TEXT,
  session_id TEXT,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id, created_at);
CREATE INDEX idx_audit_user ON audit_log(user_id, created_at);
CREATE INDEX idx_audit_tenant ON audit_log(tenant_id, created_at);

-- ============================================================
-- 14. MESSAGE_RATE_LIMITS (Anti-Ban)
-- ============================================================
CREATE TABLE message_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  
  phone TEXT NOT NULL,
  hour_bucket TIMESTAMP NOT NULL,
  message_count INT DEFAULT 0,
  
  last_message_at TIMESTAMP,
  
  UNIQUE(tenant_id, phone, hour_bucket)
);

CREATE INDEX idx_rate_limits_hour ON message_rate_limits(hour_bucket);

-- ============================================================
-- 15. PROMPT_VERSIONS (Blind Spot #20 - Drift de Prompt)
-- ============================================================
CREATE TABLE prompt_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- 'livia_system_prompt'
  version TEXT NOT NULL, -- 'v1.2.3'
  content TEXT NOT NULL,
  
  active BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP DEFAULT NOW(),
  deployed_at TIMESTAMP,
  deployed_by UUID REFERENCES users(id),
  
  rollback_from UUID REFERENCES prompt_versions(id),
  
  UNIQUE(name, version)
);

CREATE INDEX idx_prompt_active ON prompt_versions(name) WHERE active = true;

-- ============================================================
-- RLS POLICIES
-- ============================================================

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapists ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapist_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_versions ENABLE ROW LEVEL SECURITY;

-- Blind Spot #2: Funções para session-based tenant isolation
CREATE OR REPLACE FUNCTION set_current_tenant(p_tenant_id UUID)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_tenant_id', p_tenant_id::text, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_current_tenant()
RETURNS UUID AS $$
BEGIN
  RETURN NULLIF(current_setting('app.current_tenant_id', true), '')::UUID;
END;
$$ LANGUAGE plpgsql STABLE;

-- Política base (aplicar em todas as tabelas com tenant_id)
CREATE POLICY tenant_isolation_v2 ON contacts
  FOR ALL TO authenticated
  USING (
    tenant_id = get_current_tenant() 
    OR (SELECT is_super_admin FROM users WHERE id = auth.uid())
  );

-- ============================================================
-- VIEWS ISOLADAS PARA N8N (Blind Spot #2)
-- ============================================================
CREATE VIEW v_n8n_leads AS
SELECT * FROM leads 
WHERE tenant_id = get_current_tenant()
  AND deleted_at IS NULL;

CREATE VIEW v_n8n_appointments AS
SELECT * FROM appointments 
WHERE tenant_id = get_current_tenant();

CREATE VIEW v_n8n_conversations AS
SELECT * FROM conversations 
WHERE tenant_id = get_current_tenant();

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_therapists_updated_at BEFORE UPDATE ON therapists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para calcular próximo follow-up
CREATE OR REPLACE FUNCTION calculate_next_followup(stage INT, last_interaction TIMESTAMP)
RETURNS TIMESTAMP AS $$
BEGIN
  RETURN CASE stage
    WHEN 0 THEN last_interaction + INTERVAL '24 hours'
    WHEN 1 THEN last_interaction + INTERVAL '72 hours'
    WHEN 2 THEN last_interaction + INTERVAL '7 days'
    WHEN 3 THEN last_interaction + INTERVAL '30 days'
    WHEN 4 THEN last_interaction + INTERVAL '60 days'
    ELSE last_interaction + INTERVAL '90 days'
  END;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar next_followup_at
CREATE OR REPLACE FUNCTION update_next_followup()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'follow_up' THEN
    NEW.next_followup_at = calculate_next_followup(NEW.followup_stage, NEW.last_interaction_at);
  ELSE
    NEW.next_followup_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_leads_next_followup BEFORE INSERT OR UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_next_followup();

-- Blind Spot #8: Trigger para cancelar follow-ups ao converter lead
CREATE OR REPLACE FUNCTION on_lead_converted()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.converted_to_patient_id IS NOT NULL AND OLD.converted_to_patient_id IS NULL THEN
    NEW.status = 'convertido';
    NEW.next_followup_at = NULL;
    
    INSERT INTO audit_log (entity_type, entity_id, action, changes, action_source)
    VALUES ('lead', NEW.id, 'auto_cancel_followup', 
      jsonb_build_object('reason', 'converted_to_patient'), 'system');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_lead_converted
BEFORE UPDATE ON leads
FOR EACH ROW EXECUTE FUNCTION on_lead_converted();

-- Blind Spot #3: Função de limpeza de queue
CREATE OR REPLACE FUNCTION cleanup_processed_queue()
RETURNS void AS $$
BEGIN
  -- Sanitizar payload após 24h
  UPDATE message_queue 
  SET raw_payload = jsonb_build_object(
    'phone', raw_payload->>'phone',
    'processed_at', processing_completed_at,
    'status', status
  )
  WHERE status = 'processed' 
    AND processing_completed_at < NOW() - INTERVAL '24 hours'
    AND raw_payload->>'diagnosis' IS NOT NULL;
    
  -- Hard delete após 7 dias
  DELETE FROM message_queue
  WHERE status = 'processed'
    AND processing_completed_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Agendar via pg_cron
SELECT cron.schedule('cleanup-queue', '0 3 * * *', 'SELECT cleanup_processed_queue()');

-- ============================================================
-- SEED DATA
-- ============================================================

-- Feriados Nacionais 2026
INSERT INTO holidays (tenant_id, date, name, type) VALUES
  (NULL, '2026-01-01', 'Confraternização Universal', 'national'),
  (NULL, '2026-02-16', 'Carnaval', 'national'),
  (NULL, '2026-02-17', 'Carnaval', 'national'),
  (NULL, '2026-04-03', 'Sexta-feira Santa', 'national'),
  (NULL, '2026-04-21', 'Tiradentes', 'national'),
  (NULL, '2026-05-01', 'Dia do Trabalho', 'national'),
  (NULL, '2026-06-04', 'Corpus Christi', 'national'),
  (NULL, '2026-09-07', 'Independência do Brasil', 'national'),
  (NULL, '2026-10-12', 'Nossa Senhora Aparecida', 'national'),
  (NULL, '2026-11-02', 'Finados', 'national'),
  (NULL, '2026-11-15', 'Proclamação da República', 'national'),
  (NULL, '2026-12-25', 'Natal', 'national')
ON CONFLICT DO NOTHING;

-- Prompt inicial da Lívia
INSERT INTO prompt_versions (name, version, content, active, deployed_at) VALUES
('livia_system_prompt', 'v1.0.0', 
'Você é a Lívia, assistente virtual da clínica.

REGRAS CRÍTICAS:
1. NUNCA pergunte informações já fornecidas
2. Para múltiplos filhos, SEMPRE especificar para qual
3. NUNCA criar agendamento sem ouvir "CONFIRMAR"
4. Mensagens curtas ("ok", "sim") NÃO disparam side-effects
5. Se não entender 2x seguidas, escalar para humano

CONSENTIMENTO: Antes de coletar dados de saúde, pedir aceite LGPD.',
true, NOW())
ON CONFLICT DO NOTHING;

-- ============================================================
-- END OF SCHEMA v3.2
-- ============================================================
