# KoraOS MVP - Blind Spots v3.0 Consolidado
## 19 Pontos Cegos Críticos + Soluções Aprovadas

**Data**: 2026-02-08  
**Status**: ✅ APROVADO PARA IMPLEMENTAÇÃO  
**Fonte**: Análise Multi-LLM (5 modelos) + Síntese + Aprovação Gabriel

---

## Índice por Categoria

| Cat | # | Título | Criticidade |
|-----|---|--------|-------------|
| 🔐 | 1 | Guarda compartilhada / Pais divorciados | HIGH |
| 🔐 | 2 | Vazamento cross-tenant via N8N | HIGH |
| 🔐 | 3 | PII em logs/audit (LGPD) | HIGH |
| ⚡ | 4 | Tool call "stale" / Corrida de interrupção | HIGH |
| ⚡ | 6 | Agendamento duplo / Overbooking | HIGH |
| ⚡ | 7 | Appointment órfão (falha parcial) | MEDIUM |
| 🤖 | 8 | Follow-up após conversão (Lead zumbi) | HIGH |
| 🤖 | 9 | Human takeover deadlock | HIGH |
| 🤖 | 10 | Edição/remoção de mensagens WhatsApp | MEDIUM |
| 📦 | 11 | URLs de mídia expiram / Alucinação | HIGH |
| 📦 | 13 | Webhooks duplicados (Uazapi) | MEDIUM |
| 🤖 | 14 | Follow-up vs Conversa ativa (colisão) | MEDIUM |
| ⏰ | 15 | Fuso horário / DST inconsistente | MEDIUM |
| 📦 | 16 | Soft delete cria lead zumbi | MEDIUM |
| ⚡ | 17 | Concorrência cross-workflow | HIGH |
| 🤖 | 18 | Ambiguidade semântica ("ok", "sim") | MEDIUM |
| 📦 | 19 | Fila sem limite / Dead-letter | MEDIUM |
| 🤖 | 20 | Drift de prompt sem regressão | MEDIUM |

---

## 1. Guarda Compartilhada / Pais Divorciados [HIGH CONFIDENCE]

### O Problema
O modelo "1 telefone = 1 contato = N pacientes" falha quando:
- Múltiplos responsáveis (mãe/pai divorciados) querem acesso ao mesmo paciente
- Mesmo número é compartilhado/alternado entre responsáveis
- Novo número tenta acessar paciente existente sem validação

### Riscos
- **LGPD**: Vazamento de dados para pessoa não autorizada
- **Clínico**: Prontuários duplicados
- **Operacional**: Conflito de agendamentos

### Solução Aprovada

#### 1.1 Nova Tabela: `patient_guardians`
```sql
CREATE TABLE patient_guardians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  
  relationship TEXT NOT NULL, -- 'mother', 'father', 'guardian', 'grandparent'
  is_primary BOOLEAN DEFAULT false, -- Responsável principal
  
  -- Permissões granulares
  can_schedule BOOLEAN DEFAULT true,
  can_cancel BOOLEAN DEFAULT true,
  can_view_medical BOOLEAN DEFAULT false, -- Acesso a laudos/prontuário
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
```

#### 1.2 Fluxo de Vínculo Seguro
```
Novo número tenta acessar paciente existente:
1. Lívia detecta: "Você mencionou João Silva. Já temos um cadastro."
2. Cria ticket: "Validar vínculo: (11) 98888-0000 quer acesso a João Silva (pac_123)"
3. Secretária liga para número existente (mãe) e confirma
4. Se OK: INSERT em patient_guardians com verified_by/at
5. Se NÃO: Ticket fechado como "Acesso negado - não é responsável"
```

#### 1.3 Atualização na Lógica da Lívia
```typescript
// Ao carregar contexto
const context = await getContactContext(phone);
// Agora inclui:
// - patients_as_primary: Patient[] (pode agendar/cancelar)
// - patients_as_guardian: Patient[] (com permissões limitadas)

// System prompt atualizado:
"Você está falando com {{contact.name}}.
Pacientes como responsável principal: {{patients_as_primary | map: name}}
Pacientes como responsável secundário: {{patients_as_guardian | map: name}}

REGRA: Para responsáveis secundários, verificar permissões antes de cada ação."
```

---

## 2. Vazamento Cross-Tenant via N8N [HIGH CONFIDENCE]

### O Problema
Workflows N8N podem retornar dados de múltiplos tenants se:
- Terapeuta atua em 2+ clínicas
- User de serviço tem permissões elevadas
- Faltou `tenant_id` em cláusula WHERE

### Riscos
- **LGPD**: Vazamento de dados entre clínicas
- **Comercial**: Segredo de negócio exposto

### Solução Aprovada

#### 2.1 Variáveis de Sessão PostgreSQL
```sql
-- Função para setar tenant na sessão
CREATE OR REPLACE FUNCTION set_current_tenant(p_tenant_id UUID)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_tenant_id', p_tenant_id::text, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para recuperar tenant
CREATE OR REPLACE FUNCTION get_current_tenant()
RETURNS UUID AS $$
BEGIN
  RETURN NULLIF(current_setting('app.current_tenant_id', true), '')::UUID;
END;
$$ LANGUAGE plpgsql STABLE;

-- RLS Policy atualizada (todas as tabelas)
CREATE POLICY tenant_isolation_v2 ON leads
  FOR ALL TO authenticated
  USING (
    tenant_id = get_current_tenant() 
    OR (SELECT is_super_admin FROM users WHERE id = auth.uid())
  );
```

#### 2.2 Views Isoladas para N8N
```sql
-- N8N nunca consulta tabelas base, sempre views
CREATE VIEW v_n8n_leads AS
SELECT * FROM leads 
WHERE tenant_id = get_current_tenant()
  AND deleted_at IS NULL;

CREATE VIEW v_n8n_appointments AS
SELECT * FROM appointments 
WHERE tenant_id = get_current_tenant();

-- Nest.js SEMPRE chama set_current_tenant antes de qualquer query
```

#### 2.3 Middleware Nest.js
```typescript
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly supabase: SupabaseService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const tenantId = req.headers['x-tenant-id'] || req.user?.tenant_id;
    
    if (!tenantId) {
      throw new ForbiddenException('Tenant ID required');
    }
    
    // Setar na sessão do Supabase
    await this.supabase.rpc('set_current_tenant', { p_tenant_id: tenantId });
    
    next();
  }
}
```

---

## 3. PII/Sensíveis em Logs e Audit (LGPD) [HIGH CONFIDENCE]

### O Problema
Dados de saúde (inclusive de menores) podem vazar em:
- Logs do Nest.js (stacktraces)
- Payloads no N8N (debug mode)
- message_queue (raw_payload completo)
- audit_log (changes JSONB)

### Riscos
- **LGPD**: Breach silencioso + multas
- **Reputacional**: Exposição em backups

### Solução Aprovada (A + B)

#### 3.1 Sanitização Obrigatória
```typescript
// utils/sanitizer.ts
const PII_FIELDS = [
  'diagnosis', 'medical_notes', 'diagnosis_documents',
  'insurance_number', 'birth_date', 'phone', 'email',
  'transcription', 'vision_analysis', 'message_text'
];

export function sanitizeForLog(obj: any): any {
  if (!obj) return obj;
  
  const sanitized = { ...obj };
  
  for (const field of PII_FIELDS) {
    if (sanitized[field]) {
      if (typeof sanitized[field] === 'string') {
        sanitized[field] = `[REDACTED:${field}:${sanitized[field].length}chars]`;
      } else {
        sanitized[field] = '[REDACTED]';
      }
    }
  }
  
  // Recursivo para objetos aninhados
  for (const key of Object.keys(sanitized)) {
    if (typeof sanitized[key] === 'object' && !Array.isArray(sanitized[key])) {
      sanitized[key] = sanitizeForLog(sanitized[key]);
    }
  }
  
  return sanitized;
}

// Uso no logger global
logger.info('Processing message', sanitizeForLog(payload));
```

#### 3.2 Retenção Agressiva
```sql
-- Cron job: limpar message_queue após processamento
CREATE OR REPLACE FUNCTION cleanup_processed_queue()
RETURNS void AS $$
BEGIN
  -- Manter apenas metadados, remover payload
  UPDATE message_queue 
  SET raw_payload = jsonb_build_object(
    'phone', raw_payload->>'phone',
    'processed_at', processing_completed_at,
    'status', status
  )
  WHERE status = 'processed' 
    AND processing_completed_at < NOW() - INTERVAL '24 hours';
    
  -- Hard delete após 7 dias
  DELETE FROM message_queue
  WHERE status = 'processed'
    AND processing_completed_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Agendar via pg_cron
SELECT cron.schedule('cleanup-queue', '0 3 * * *', 'SELECT cleanup_processed_queue()');
```

#### 3.3 Audit Log Sanitizado
```typescript
// Antes de salvar no audit_log
const sanitizedChanges = {
  before: sanitizeForLog(changes.before),
  after: sanitizeForLog(changes.after),
  fields_changed: Object.keys(changes.after) // Só nomes dos campos
};

await this.auditService.log({
  ...auditEntry,
  changes: sanitizedChanges
});
```

---

## 4. Tool Call "Stale" / Corrida de Interrupção [HIGH CONFIDENCE]

### O Problema
1. IA decide executar `criar_agendamento`
2. Usuário manda "NÃO, espera!" antes da execução
3. Sistema executa mesmo assim (mensagem nova ainda não processada)

### Riscos
- Agendamentos indevidos
- Quebra de confiança ("IA me ignorou")

### Solução Aprovada (A + B)

#### 4.1 Versionamento de Conversa
```sql
ALTER TABLE conversations ADD COLUMN version INT DEFAULT 1;
ALTER TABLE conversations ADD COLUMN last_message_at TIMESTAMP DEFAULT NOW();

-- Trigger para incrementar version a cada mensagem
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
```

#### 4.2 Last-Mile Check no Nest.js
```typescript
@Injectable()
export class ToolExecutionGuard {
  async executeWithCheck<T>(
    conversationId: string,
    versionAtStart: number,
    action: () => Promise<T>
  ): Promise<T | { aborted: true; reason: string }> {
    
    // Verificar se houve novas mensagens
    const current = await this.conversationsService.findOne(conversationId);
    
    if (current.version !== versionAtStart) {
      return {
        aborted: true,
        reason: `Nova mensagem detectada. Version: ${versionAtStart} → ${current.version}`
      };
    }
    
    // Executar ação
    return action();
  }
}

// Uso no workflow de agendamento
const result = await this.guard.executeWithCheck(
  conversationId,
  context.conversation_version,
  () => this.appointmentsService.create(dto)
);

if (result.aborted) {
  // Reprocessar com contexto atualizado
  await this.n8n.trigger('reprocess_with_new_context', { conversationId });
}
```

---

## 6. Agendamento Duplo / Overbooking [HIGH]

### O Problema
Confirmações duplicadas ou concorrência podem criar overbooking se o banco aceitar INSERTs conflitantes.

### Solução Aprovada (A + B)

#### 6.1 Constraint de Exclusão PostgreSQL
```sql
-- Extensão para GIST com ranges
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Constraint que impede overbooking
ALTER TABLE appointments ADD CONSTRAINT no_double_booking
EXCLUDE USING GIST (
  therapist_id WITH =,
  tsrange(scheduled_at, scheduled_at + (duration_minutes || ' minutes')::interval) WITH &&
)
WHERE (status NOT IN ('cancelled', 'no_show'));
```

#### 6.2 Idempotência no Gateway
```typescript
// Redis para dedupe
@Injectable()
export class IdempotencyService {
  constructor(private readonly redis: RedisService) {}

  async checkAndSet(key: string, ttlSeconds: number = 300): Promise<boolean> {
    const result = await this.redis.set(
      `idempotency:${key}`,
      '1',
      'EX', ttlSeconds,
      'NX' // Only set if not exists
    );
    return result === 'OK';
  }
}

// Uso no endpoint de agendamento
@Post()
async create(@Body() dto: CreateAppointmentDto) {
  const idempotencyKey = `${dto.patient_id}:${dto.scheduled_at}:${dto.therapist_id}`;
  
  const isNew = await this.idempotency.checkAndSet(idempotencyKey);
  if (!isNew) {
    throw new ConflictException('Agendamento duplicado detectado. Ignorando.');
  }
  
  return this.appointmentsService.create(dto);
}
```

---

## 7. Appointment Órfão (Falha Parcial) [MEDIUM]

### O Problema
Agendamento criado no banco, mas mensagem de confirmação falha (timeout/500).
Resultado: slot bloqueado, família sem confirmação.

### Solução Aprovada (A + B)

#### 7.1 Two-Phase Commit Lógico
```sql
-- Novo status intermediário
ALTER TABLE appointments ADD COLUMN confirmation_message_status TEXT DEFAULT 'pending';
-- 'pending', 'sent', 'failed', 'retrying'

ALTER TABLE appointments ADD COLUMN confirmation_retry_count INT DEFAULT 0;
ALTER TABLE appointments ADD COLUMN confirmation_last_error TEXT;
```

```typescript
// Fluxo
async createAppointment(dto: CreateAppointmentDto) {
  // Fase 1: Criar com status pending_confirmation
  const appointment = await this.repo.save({
    ...dto,
    status: 'pending_confirmation',
    confirmation_message_status: 'pending'
  });
  
  try {
    // Fase 2: Enviar mensagem
    await this.whatsapp.send(dto.contact_phone, confirmationMessage);
    
    // Fase 3: Atualizar para scheduled
    await this.repo.update(appointment.id, {
      status: 'scheduled',
      confirmation_message_status: 'sent'
    });
  } catch (error) {
    // Marcar para retry
    await this.repo.update(appointment.id, {
      confirmation_message_status: 'failed',
      confirmation_last_error: error.message
    });
    
    // Agendar retry
    await this.queue.add('retry_confirmation', { appointmentId: appointment.id }, {
      delay: 60000, // 1 minuto
      attempts: 3
    });
  }
  
  return appointment;
}
```

#### 7.2 Cron de Verificação
```typescript
// A cada 5 minutos, verificar órfãos
@Cron('*/5 * * * *')
async checkOrphanAppointments() {
  const orphans = await this.repo.find({
    where: {
      status: 'pending_confirmation',
      created_at: LessThan(subMinutes(new Date(), 10)), // Há mais de 10 min
      confirmation_retry_count: LessThan(3)
    }
  });
  
  for (const orphan of orphans) {
    await this.queue.add('retry_confirmation', { appointmentId: orphan.id });
  }
}
```

---

## 8. Follow-up após Conversão (Lead Zumbi) [HIGH CONFIDENCE]

### O Problema
Workflows de follow-up disparam mesmo após lead virar paciente.

### Solução Aprovada

#### 8.1 State Guard no Workflow
```javascript
// Início de TODOS os workflows de follow-up
const lead = await $http.get(`${NESTJS_URL}/api/leads/${leadId}`);

// Guard obrigatório
if (!['follow_up', 'qualificado'].includes(lead.status)) {
  return { 
    skipped: true, 
    reason: `Estado inválido: ${lead.status}`,
    action: 'auto_cancel'
  };
}

// Se lead foi convertido, cancelar follow-ups pendentes
if (lead.converted_to_patient_id) {
  await $http.post(`${NESTJS_URL}/api/leads/${leadId}/cancel-all-followups`);
  return { skipped: true, reason: 'Lead já convertido' };
}
```

#### 8.2 Trigger ao Converter
```sql
CREATE OR REPLACE FUNCTION on_lead_converted()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.converted_to_patient_id IS NOT NULL AND OLD.converted_to_patient_id IS NULL THEN
    -- Cancelar todos os follow-ups pendentes
    UPDATE leads 
    SET status = 'convertido',
        next_followup_at = NULL
    WHERE id = NEW.id;
    
    -- Log de auditoria
    INSERT INTO audit_log (entity_type, entity_id, action, changes)
    VALUES ('lead', NEW.id, 'auto_cancel_followup', 
      jsonb_build_object('reason', 'converted_to_patient'));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_lead_converted
AFTER UPDATE ON leads
FOR EACH ROW EXECUTE FUNCTION on_lead_converted();
```

---

## 9. Human Takeover Deadlock [HIGH CONFIDENCE]

### O Problema
Conversa entra em modo humano e fica muda indefinidamente.

### Solução Aprovada (A + B)

#### 9.1 Timeout com Escalonamento
```sql
ALTER TABLE leads ADD COLUMN human_takeover_deadline TIMESTAMP;
ALTER TABLE leads ADD COLUMN escalation_level INT DEFAULT 0;
-- 0 = normal, 1 = alerta secretária, 2 = alerta gestor, 3 = auto-reply
```

```typescript
// Ao ativar human takeover
async activateHumanTakeover(leadId: string, reason: string) {
  const deadlineMinutes = reason === 'frustration' ? 15 : 60;
  
  await this.repo.update(leadId, {
    human_takeover: true,
    human_takeover_at: new Date(),
    human_takeover_reason: reason,
    human_takeover_deadline: addMinutes(new Date(), deadlineMinutes),
    escalation_level: 0
  });
  
  // Agendar verificação
  await this.queue.add('check_takeover_deadline', { leadId }, {
    delay: deadlineMinutes * 60 * 1000
  });
}
```

#### 9.2 Cron de Verificação
```typescript
@Cron('*/5 * * * *')
async checkTakeoverDeadlines() {
  const overdue = await this.repo.find({
    where: {
      human_takeover: true,
      human_takeover_deadline: LessThan(new Date())
    }
  });
  
  for (const lead of overdue) {
    switch (lead.escalation_level) {
      case 0:
        // Nível 1: Alertar secretária
        await this.notifySecretary(lead, 'URGENTE: Conversa aguardando há muito tempo');
        await this.repo.update(lead.id, { 
          escalation_level: 1,
          human_takeover_deadline: addMinutes(new Date(), 15)
        });
        break;
        
      case 1:
        // Nível 2: Alertar gestor
        await this.notifyManager(lead, 'CRÍTICO: Conversa sem resposta humana');
        await this.repo.update(lead.id, { 
          escalation_level: 2,
          human_takeover_deadline: addMinutes(new Date(), 30)
        });
        break;
        
      case 2:
        // Nível 3: Auto-reply + devolver para IA
        await this.whatsapp.send(lead.contact.phone, 
          'Desculpe a demora! Nossa equipe está analisando sua solicitação. ' +
          'Retornaremos em breve. Enquanto isso, posso ajudar com algo mais?'
        );
        await this.repo.update(lead.id, { 
          human_takeover: false,
          escalation_level: 3
        });
        break;
    }
  }
}
```

---

## 10. Edição/Remoção de Mensagens WhatsApp [MEDIUM]

### O Problema
Usuário apaga/edita mensagem, mas sistema já ingeriu. IA referencia algo que "não existe" mais.

### Solução Aprovada (B prioritário)

#### 10.1 Webhook para message_revoked
```typescript
// Endpoint para webhook de revogação
@Post('webhook/message-revoked')
async handleMessageRevoked(@Body() payload: { messageId: string }) {
  const message = await this.messagesRepo.findOne({ 
    where: { external_id: payload.messageId } 
  });
  
  if (message) {
    // Soft delete + marcar como revogada
    await this.messagesRepo.update(message.id, {
      deleted_at: new Date(),
      message_text: '[MENSAGEM REMOVIDA PELO USUÁRIO]',
      transcription: null,
      vision_analysis: null
    });
    
    // Invalidar do contexto
    await this.redis.del(`context:${message.conversation_id}`);
    
    // Log
    await this.auditService.log({
      action: 'message_revoked_by_user',
      entity_type: 'message',
      entity_id: message.id
    });
  }
}
```

#### 10.2 System Prompt Atualizado
```
REGRA CRÍTICA: Se você receber no histórico uma mensagem marcada como 
"[MENSAGEM REMOVIDA PELO USUÁRIO]", NÃO faça referência ao conteúdo anterior. 
Trate como se a mensagem nunca tivesse existido.
```

---

## 11. URLs de Mídia Expiram / Alucinação [HIGH]

### O Problema
URL temporária de WhatsApp expira; workflow em retry recebe HTML de "link expirado" e IA pode confabular.

### Solução Aprovada (A + B)

#### 11.1 Eager Ingestion (já parcialmente implementado)
```typescript
// No workflow de classificação, ANTES de qualquer processamento
async processMedia(mediaUrl: string, mimeType: string) {
  try {
    // Download imediato
    const response = await axios.get(mediaUrl, { 
      responseType: 'arraybuffer',
      timeout: 30000
    });
    
    // Validar Content-Type
    const actualContentType = response.headers['content-type'];
    if (actualContentType.includes('text/html')) {
      throw new Error('URL_EXPIRED: Received HTML instead of media');
    }
    
    // Upload para Supabase Storage
    const storedPath = await this.storage.upload(
      `media/${Date.now()}_${mimeType.split('/')[1]}`,
      response.data
    );
    
    return { storedPath, originalMimeType: mimeType };
    
  } catch (error) {
    if (error.message.includes('URL_EXPIRED')) {
      // NÃO enviar para IA - marcar como mídia perdida
      return { 
        error: 'MEDIA_EXPIRED',
        fallbackMessage: 'Não consegui acessar a mídia enviada. Pode reenviar, por favor?'
      };
    }
    throw error;
  }
}
```

---

## 13. Webhooks Duplicados (Uazapi) [MEDIUM]

### O Problema
Webhooks duplicados entram na fila sem dedupe e disparam processamento múltiplo.

### Solução Aprovada (A + B)

#### 13.1 Constraint no Banco
```sql
-- external_id é o ID único da mensagem no WhatsApp
ALTER TABLE message_queue ADD COLUMN external_id TEXT;
CREATE UNIQUE INDEX idx_queue_external_unique 
ON message_queue(tenant_id, external_id) 
WHERE status != 'dead_letter';
```

#### 13.2 Upsert no Enqueue
```typescript
async enqueue(payload: any) {
  const externalId = payload.message?.id || payload.key?.id;
  
  try {
    await this.repo.upsert({
      tenant_id: payload.tenant_id,
      external_id: externalId,
      raw_payload: payload,
      status: 'pending'
    }, {
      conflictPaths: ['tenant_id', 'external_id'],
      skipUpdateIfNoValuesChanged: true
    });
  } catch (error) {
    // Já existe - ignorar silenciosamente
    if (error.code === '23505') { // unique_violation
      return { deduplicated: true };
    }
    throw error;
  }
}
```

---

## 14. Follow-up vs Conversa Ativa (Colisão) [MEDIUM]

### O Problema
Cron dispara follow-up enquanto usuário está conversando ativamente.

### Solução Aprovada

#### 14.1 Check de Atividade Recente
```javascript
// No início do workflow follow_up
const conversation = await $http.get(`${NESTJS_URL}/api/conversations/${conversationId}`);

const minutesSinceLastMessage = 
  (Date.now() - new Date(conversation.last_message_at).getTime()) / 60000;

// Se houve mensagem nos últimos 15 minutos, pular
if (minutesSinceLastMessage < 15) {
  return {
    skipped: true,
    reason: `Conversa ativa (última msg há ${minutesSinceLastMessage.toFixed(0)} min)`,
    reschedule_in: 30 // minutos
  };
}
```

---

## 15. Fuso Horário / DST Inconsistente [MEDIUM]

### O Problema
Server UTC, N8N em fusos diferentes, clínicas em outros fusos (Manaus, etc).

### Solução Aprovada (A + B)

#### 15.1 Timezone por Tenant
```sql
ALTER TABLE tenants ADD COLUMN timezone TEXT DEFAULT 'America/Sao_Paulo';
-- Valores: 'America/Sao_Paulo', 'America/Manaus', 'America/Recife', etc.
```

#### 15.2 Armazenar UTC, Converter na UI
```typescript
// Sempre salvar em UTC
async createAppointment(dto: CreateAppointmentDto) {
  const tenant = await this.tenantsService.findOne(dto.tenant_id);
  
  // Converter input local → UTC
  const scheduledAtUTC = zonedTimeToUtc(dto.scheduled_at, tenant.timezone);
  
  return this.repo.save({
    ...dto,
    scheduled_at: scheduledAtUTC
  });
}

// Ao retornar para UI
async getAppointments(tenantId: string) {
  const tenant = await this.tenantsService.findOne(tenantId);
  const appointments = await this.repo.find({ where: { tenant_id: tenantId } });
  
  return appointments.map(apt => ({
    ...apt,
    scheduled_at_local: utcToZonedTime(apt.scheduled_at, tenant.timezone)
  }));
}
```

---

## 16. Soft Delete Cria Lead Zumbi [MEDIUM]

### O Problema
Lead soft-deleted não é encontrado, sistema cria novo registro para mesmo telefone.

### Solução Aprovada (A + B)

#### 16.1 Lookup "With Deleted"
```typescript
async findOrCreateLead(contactId: string, childName: string) {
  // Primeiro: buscar incluindo deletados
  let lead = await this.repo.findOne({
    where: { 
      contact_id: contactId,
      child_name: childName
    },
    withDeleted: true // Inclui soft-deleted
  });
  
  if (lead) {
    if (lead.deleted_at) {
      // Reativar lead existente
      await this.repo.update(lead.id, {
        deleted_at: null,
        status: 'novo', // Reset status
        reactivated_at: new Date(),
        reactivation_count: lead.reactivation_count + 1
      });
      
      await this.auditService.log({
        action: 'lead_reactivated',
        entity_id: lead.id
      });
    }
    return lead;
  }
  
  // Criar novo apenas se realmente não existe
  return this.repo.save({ contact_id: contactId, child_name: childName });
}
```

---

## 17. Concorrência Cross-Workflow [HIGH]

### O Problema
Dois workflows atualizam mesmo contact/lead simultaneamente, sobrescrevendo campos.

### Solução Aprovada

#### 17.1 Mutex por Contact no Redis
```typescript
@Injectable()
export class ContactMutexService {
  constructor(private readonly redis: RedisService) {}
  
  async acquireLock(contactId: string, ttlMs: number = 30000): Promise<() => Promise<void>> {
    const lockKey = `lock:contact:${contactId}`;
    const lockValue = `${Date.now()}:${Math.random()}`;
    
    // Tentar adquirir com retry
    let acquired = false;
    for (let attempt = 0; attempt < 10; attempt++) {
      acquired = await this.redis.set(lockKey, lockValue, 'PX', ttlMs, 'NX') === 'OK';
      if (acquired) break;
      await new Promise(r => setTimeout(r, 100 * (attempt + 1))); // Backoff
    }
    
    if (!acquired) {
      throw new ConflictException(`Não foi possível obter lock para contact ${contactId}`);
    }
    
    // Retornar função de release
    return async () => {
      const current = await this.redis.get(lockKey);
      if (current === lockValue) {
        await this.redis.del(lockKey);
      }
    };
  }
}

// Uso em qualquer operação de escrita
async updateContactWithLock(contactId: string, updates: Partial<Contact>) {
  const release = await this.mutex.acquireLock(contactId);
  try {
    return await this.repo.update(contactId, updates);
  } finally {
    await release();
  }
}
```

---

## 18. Ambiguidade Semântica ("ok", "sim") [MEDIUM]

### O Problema
Resposta curta é interpretada como confirmação de múltiplas intenções.

### Solução Aprovada

#### 18.1 Regra Dura no System Prompt
```
REGRA CRÍTICA DE CONFIRMAÇÃO:
Mensagens curtas ou ambíguas ("ok", "sim", "pode ser", "beleza", "👍") 
NÃO PODEM disparar side-effects (criar agendamento, cancelar, editar).

Quando receber resposta curta APÓS apresentar opções, você DEVE reconfirmar:
"Perfeito! Só para confirmar: você quer agendar para Terça 10/02 às 14h 
com a Dra. Ana, correto? Digite CONFIRMAR para eu finalizar."

Só execute a ação após receber "CONFIRMAR", "CONFIRMADO", ou "CONFIRMA".
```

---

## 19. Fila sem Limite / Dead-Letter [MEDIUM]

### O Problema
Pico de tráfego gera crescimento indefinido da fila; retries acumulam.

### Solução Aprovada

#### 19.1 Limite + Dead-Letter
```sql
-- Configuração por tenant
ALTER TABLE tenants ADD COLUMN max_queue_size INT DEFAULT 1000;
ALTER TABLE tenants ADD COLUMN queue_alert_threshold INT DEFAULT 800;
```

```typescript
async enqueue(payload: any) {
  const tenant = await this.tenantsService.findOne(payload.tenant_id);
  
  const currentSize = await this.repo.count({
    where: { 
      tenant_id: payload.tenant_id,
      status: In(['pending', 'processing'])
    }
  });
  
  if (currentSize >= tenant.max_queue_size) {
    // Mover para dead-letter
    await this.repo.save({
      ...payload,
      status: 'dead_letter',
      dead_letter_reason: 'queue_full'
    });
    
    // Notificar super admin
    await this.notifyService.alertSuperAdmin({
      type: 'queue_overflow',
      tenant_id: payload.tenant_id,
      current_size: currentSize
    });
    
    return { queued: false, reason: 'queue_full' };
  }
  
  if (currentSize >= tenant.queue_alert_threshold) {
    await this.notifyService.alertManager({
      type: 'queue_warning',
      tenant_id: payload.tenant_id,
      current_size: currentSize,
      threshold: tenant.queue_alert_threshold
    });
  }
  
  return this.repo.save({ ...payload, status: 'pending' });
}
```

---

## 20. Drift de Prompt sem Regressão [MEDIUM]

### O Problema
Alterações incrementais no system prompt mudam decisões da Lívia sem teste formal.

### Solução Aprovada

#### 20.1 Prompt Versionado como Artefato
```sql
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
```

#### 20.2 Deploy como Código
```typescript
// Endpoint de deploy
@Post('prompts/:name/deploy')
@Roles('super_admin')
async deployPrompt(@Param('name') name: string, @Body() dto: { version: string }) {
  // Desativar versão atual
  await this.repo.update(
    { name, active: true },
    { active: false }
  );
  
  // Ativar nova versão
  const newVersion = await this.repo.findOne({
    where: { name, version: dto.version }
  });
  
  await this.repo.update(newVersion.id, {
    active: true,
    deployed_at: new Date(),
    deployed_by: this.request.user.id
  });
  
  // Invalidar cache
  await this.redis.del(`prompt:${name}`);
  
  // Audit
  await this.auditService.log({
    action: 'prompt_deployed',
    entity_type: 'prompt',
    entity_id: newVersion.id,
    changes: { version: dto.version }
  });
}

// Rollback
@Post('prompts/:name/rollback')
@Roles('super_admin')
async rollbackPrompt(@Param('name') name: string) {
  const current = await this.repo.findOne({ where: { name, active: true } });
  
  if (!current.rollback_from) {
    throw new BadRequestException('Sem versão anterior para rollback');
  }
  
  await this.deployPrompt(name, { version: current.rollback_from.version });
}
```

---

## Checklist de Implementação

| # | Título | DB | Nest.js | N8N | Status |
|---|--------|----|---------|-----|--------|
| 1 | Guarda compartilhada | ✅ | ✅ | ⬜ | 🔴 |
| 2 | Cross-tenant | ✅ | ✅ | ⬜ | 🔴 |
| 3 | PII em logs | ✅ | ✅ | ⬜ | 🔴 |
| 4 | Tool call stale | ✅ | ✅ | ⬜ | 🔴 |
| 6 | Overbooking | ✅ | ✅ | ⬜ | 🔴 |
| 7 | Appointment órfão | ✅ | ✅ | ⬜ | 🔴 |
| 8 | Lead zumbi | ✅ | ✅ | ✅ | 🔴 |
| 9 | Takeover deadlock | ✅ | ✅ | ⬜ | 🔴 |
| 10 | Mensagem revogada | ⬜ | ✅ | ⬜ | 🔴 |
| 11 | URL mídia expira | ⬜ | ✅ | ⬜ | 🔴 |
| 13 | Webhook duplicado | ✅ | ✅ | ⬜ | 🔴 |
| 14 | Follow-up colisão | ⬜ | ⬜ | ✅ | 🔴 |
| 15 | Timezone | ✅ | ✅ | ⬜ | 🔴 |
| 16 | Soft delete zumbi | ⬜ | ✅ | ⬜ | 🔴 |
| 17 | Concorrência | ⬜ | ✅ | ⬜ | 🔴 |
| 18 | Ambiguidade | ⬜ | ⬜ | ⬜ | 🔴 |
| 19 | Dead-letter | ✅ | ✅ | ⬜ | 🔴 |
| 20 | Prompt drift | ✅ | ✅ | ⬜ | 🔴 |

---

**Documento pronto para implementação.**
**Próximo passo**: Atualizar `08a_database_schema_complete.sql` com todas as alterações de schema.
