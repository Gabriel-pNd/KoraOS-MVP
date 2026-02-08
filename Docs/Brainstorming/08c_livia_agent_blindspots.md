# Lívia Agent + Blind Spots - Especificação Técnica
## Anexo C: Agente de IA e Soluções para Pontos Cegos

**Data**: 2026-02-08  
**Versão**: 3.1  

---

## PARTE 1: LÍVIA - AGENT SPECIFICATION

### 1.1 Identidade e Personalidade

**Nome**: Lívia  
**Função**: Assistente Virtual de Atendimento e Agendamento  
**Tom**: Profissional, empático, natural (não robótico)  
**Idioma**: Português Brasileiro (informal casual)

### 1.2 Capacidades Multimodais

| Input | Tecnologia | Processamento |
|-------|------------|---------------|
| Texto | GPT-4o | Direto |
| Áudio | Whisper → GPT-4o | Transcrição + Análise |
| Imagem | GPT-4o Vision | Análise + Extração OCR |
| PDF | PyPDF2 + Vision | Extração texto + Análise |

**Output**: SEMPRE texto (Lívia nunca envia áudios).

### 1.3 Context Loading (Memória)

Antes de cada interação, o sistema carrega:

```typescript
interface LiviaContext {
  contact: {
    id: string;
    name: string;
    phone: string;
    relationship_type: 'mother' | 'father' | 'guardian' | 'self';
    consent_given: boolean;
  };
  patients: Array<{
    id: string;
    name: string;
    age: number;
    diagnosis: string;
    therapies: string[];
    active_appointments: Appointment[];
  }>;
  leads: Array<{
    id: string;
    child_name: string;
    status: LeadStatus;
    collected_data: CollectedData;
  }>;
  conversation_history: Message[]; // últimas 20
  pending_confirmation: Appointment | null; // se tiver lembrete pendente
}
```

### 1.4 Regras de Comportamento (Hardcoded)

```yaml
NUNCA_FAZER:
  - Perguntar informação já coletada (verificar contexto SEMPRE)
  - Criar agendamento sem confirmação explícita ("CONFIRMAR", "SIM, CONFIRMA")
  - Enviar mais de 3 mensagens seguidas sem resposta do cliente
  - Responder se human_takeover === true
  - Atender em idiomas que não seja Português

SEMPRE_FAZER:
  - Verificar contexto antes de perguntar qualquer dado
  - Para múltiplos filhos, especificar: "Para o João, certo?"
  - Ao apresentar horários, incluir nome do terapeuta + número do conselho
  - Ao detectar frustração, pedir desculpas e oferecer humano
  - Salvar mídia no Storage ANTES de processar
  - Atualizar status do lead após cada mudança significativa

PERGUNTAR_PREFERÊNCIA_IRMÃOS:
  - "Você prefere agendamentos no mesmo horário ou em sequência?"
  - Validar que mãe não precisa estar em 2 lugares ao mesmo tempo
```

### 1.5 Pipeline de Status (Transições)

```
              ┌─────────────────────────────────────────────┐
              │                                             │
              ▼                                             │
[NOVO] ─────► [EM_QUALIFICACAO] ─────► [QUALIFICADO] ─────► [AGENDADO]
   │                 │                      │                   │
   │                 │                      │                   │
   │                 └───────► [PERDIDO] ◄──┘                   │
   │                              ▲                             │
   │                              │                             │
   │           (pediu para parar / fechou com outro)            ▼
   │                                                 ┌──────────────────┐
   │                                                 │                  │
   └─────────────────────────────────────────────────│   [FOLLOW_UP]   │
                                                     │   (sem resposta) │
                                                     └────────┬─────────┘
                                                              │
                                                              ▼
                                                     [UNREACHABLE]
                                                     (número bloqueado)
                                                     
[AGENDADO] ────► [CONFIRMADO] ────► [SUCESSO] ────► [CONVERTIDO]
                      │              (2 dias)           │
                      │                                 │
                      └─────────► [NO_SHOW] ◄───────────┘
```

**Triggers de Transição**:
- `novo → em_qualificacao`: Primeira resposta da Lívia
- `em_qualificacao → qualificado`: Dados mínimos coletados (nome, idade, disponibilidade)
- `qualificado → follow_up`: 24h sem resposta
- `follow_up → perdido`: Pediu "PARE" ou fechou com concorrente
- `agendado → confirmado`: Resposta "SIM" ao lembrete
- `confirmado → sucesso`: Paciente compareceu (fica 2 dias visível)
- `sucesso → convertido`: Automático após 2 dias

### 1.6 Tools (Function Calling)

```typescript
// Tool 1: Consultar Disponibilidade
interface ConsultarDisponibilidadeInput {
  patient_ids: string[];           // Pode ser array para irmãos
  therapy_types: ('ABA' | 'Fono' | 'TO' | 'Psico')[];
  preferred_dates: string[];       // ISO dates
  logistics_preference?: 'same_time' | 'sequential';
}
interface ConsultarDisponibilidadeOutput {
  options: Array<{
    date: string;
    appointments: Array<{
      patient_name: string;
      time: string;
      therapist_name: string;
      therapist_council: string;
      therapy_type: string;
    }>;
    logistics_quality: 'optimal' | 'good' | 'acceptable';
  }>;
}

// Tool 2: Criar Agendamento (REQUER confirmed_by_contact)
interface CriarAgendamentoInput {
  patient_id: string;
  therapist_id: string;
  scheduled_at: string;    // ISO datetime
  therapy_type: string;
  duration_minutes: number;
  confirmed_by_contact: true; // OBRIGATÓRIO ser true
}

// Tool 3: Reagendar
interface ReagendarInput {
  appointment_id: string;
  new_scheduled_at: string;
  reason: string;
}

// Tool 4: Cancelar
interface CancelarInput {
  appointment_id: string;
  reason: string;
}

// Tool 5: Atualizar Status do Lead
interface AtualizarLeadInput {
  lead_id: string;
  new_status: LeadStatus;
  notes?: string;
}

// Tool 6: Escalar para Humano
interface EscalarInput {
  contact_id: string;
  reason: 'frustration' | 'suspicious' | 'comprehension_failure' | 'explicit_request';
  context: string;  // Descrição do que aconteceu
}
```

### 1.7 Detecção de Escalação

```typescript
const escalationTriggers = {
  frustration: {
    keywords: ['absurdo', 'ridículo', 'vergonha', 'péssimo', 'horrível', 'nunca mais'],
    sentiment_threshold: -0.7,
    action: () => escalate('frustration')
  },
  
  suspicious: {
    patterns: [
      /compra.*pix/i,
      /urgente.*dinheiro/i,
      /\.ws\//i, // links suspeitos
      /oferta.*imperdível/i
    ],
    repeated_spam: 5, // mesma msg 5x
    action: () => escalate('suspicious')
  },
  
  comprehension_failure: {
    consecutive_failures: 2,
    detection: () => ia_response.includes('Desculpe, não entendi'),
    action: () => escalate('comprehension_failure')
  },
  
  explicit_request: {
    keywords: ['falar com humano', 'atendente', 'pessoa real', 'gerente', 'responsável'],
    action: () => escalate('explicit_request')
  }
};
```

### 1.8 Consentimento LGPD (Soft Opt-in / Frictionless)

**Objetivo**: Manter conformidade sem bloquear o fluxo da conversa.
**Estratégia**: Consentimento Implícito por Ação Positiva (Envio de Dados).

Em vez de "Pare tudo e assine", usamos um disclaimer informativo no momento da solicitação de dados:

**Script da Lívia**:
```
"Para eu verificar a disponibilidade e te orientar certinho sobre o melhor terapeuta para o [Nome], 
você pode me enviar uma foto do laudo ou da carteirinha do convênio? 📸

(Pode ficar tranquila(o): aqui na Kora cuidamos dos seus dados com total sigilo e carinho! 
Sua privacidade e a segurança da sua família são nossa prioridade. 🔒✨)"
```

**Mecanismo Técnico**:
1. **Trigger**: Recebimento de Mídia (Imagem/PDF) APÓS solicitação de dados sensíveis.
2. **Ação**:
   - Sistema detecta arquivo.
   - Registra `consent_given: true` automaticamente.
   - Armazena metadata: `{ type: 'implicit_by_upload', timestamp: NOW() }`.

**Se o cliente questionar ("Por que precisa disso?"):**
Aí sim enviamos a explicação detalhada:
*"Para cumprirmos a LGPD e garantirmos a segurança dos dados de saúde do [Nome], precisamos desse registro. Se preferir, pode agendar presencialmente."*

---

## PARTE 2: BLIND SPOTS E SOLUÇÕES TÉCNICAS

### Categoria A: Workflows N8N

#### 1. Rate Limit Uazapi (Anti-Ban)

**Problema**: Enviar muitas mensagens pode banir o número.

**Solução Implementada**:
```sql
-- Tabela message_rate_limits
-- Max 6 msgs/hora por número
-- Intervalos randômicos (+/- 30%)

CREATE FUNCTION can_send_message(p_phone TEXT, p_tenant_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_count INT;
  v_hour_bucket TIMESTAMP;
BEGIN
  v_hour_bucket := date_trunc('hour', NOW());
  
  SELECT message_count INTO v_count
  FROM message_rate_limits
  WHERE tenant_id = p_tenant_id 
    AND phone = p_phone 
    AND hour_bucket = v_hour_bucket;
  
  RETURN COALESCE(v_count, 0) < 6;
END;
$$ LANGUAGE plpgsql;
```

**No N8N**:
```javascript
// Antes de enviar qualquer mensagem
const canSend = await checkRateLimit(phone);
if (!canSend) {
  // Aguardar próximo ciclo
  return { skip: true, reason: 'rate_limit' };
}

// Calcular delay randômico
const baseDelay = 5000; // 5 segundos mínimo
const randomFactor = 0.7 + Math.random() * 0.6; // 70% a 130%
await wait(baseDelay * randomFactor);
```

---

#### 2. AI Failure (Fallback)

**Problema**: OpenAI pode falhar (timeout, 500, rate limit).

**Solução Implementada**:
```javascript
// No N8N Error Trigger
try {
  const response = await openai.chat.completions.create({...});
} catch (error) {
  const isClinicOpen = await checkClinicHours(tenantId);
  
  await createTicket({
    type: 'system_error',
    reason: 'ai_failure',
    priority: 'urgent',
    error_details: error.message
  });
  
  if (!isClinicOpen) {
    // Clínica fechada: enviar mensagem padrão
    await sendWhatsApp(phone, 
      "Estou com uma instabilidade técnica momentânea. " +
      "Já avisei nossa equipe e retornaremos em breve! 😊"
    );
  }
  // Se clínica aberta: só ticket (secretária vai assumir)
}
```

---

#### 3. Locking Otimista (Race Condition)

**Problema**: Secretária e Lívia editam mesmo lead simultaneamente.

**Solução Implementada**:
```typescript
// No Nest.js Controller
@Patch(':id')
async updateLead(
  @Param('id') id: string,
  @Body() dto: UpdateLeadDto,
  @Headers('X-Expected-Version') expectedVersion: string
) {
  const lead = await this.leadsService.findOne(id);
  
  // Comparar updated_at
  if (lead.updated_at.toISOString() !== expectedVersion) {
    throw new ConflictException({
      message: 'Este registro foi modificado por outro usuário.',
      current_version: lead.updated_at,
      your_version: expectedVersion,
      suggestion: 'Recarregue a página e tente novamente.'
    });
  }
  
  return this.leadsService.update(id, dto);
}
```

**No Frontend**:
```typescript
// Ao carregar lead
const lead = await api.getLead(id);
const version = lead.updated_at;

// Ao salvar
try {
  await api.updateLead(id, data, { 
    headers: { 'X-Expected-Version': version } 
  });
} catch (error) {
  if (error.status === 409) {
    toast.error('Registro modificado. Recarregando...');
    refetch();
  }
}
```

---

#### 4. Fila de Mensagens (Anti-Loss)

**Problema**: Se N8N cair, mensagens são perdidas.

**Solução Implementada**:
```
Uazapi Webhook
      │
      ▼
┌─────────────────────┐
│    Nest.js API      │
│  POST /queue/enqueue│
│                     │
│  1. Salvar em       │
│     message_queue   │
│  2. Retornar 200 OK │
└─────────┬───────────┘
          │
          │ (ACK imediato para Uazapi)
          │
          ▼
┌─────────────────────┐
│   N8N (Polling)     │
│   GET /queue/pending│
│                     │
│   A cada 5 segundos │
│   processa 1 msg    │
│   da fila           │
└─────────────────────┘
```

**Endpoint Nest.js**:
```typescript
@Post('enqueue')
async enqueue(@Body() payload: any) {
  await this.queueService.create({
    raw_payload: payload,
    phone: this.extractPhone(payload),
    status: 'pending'
  });
  return { success: true }; // 200 imediato
}

@Get('pending')
async getPending() {
  return this.queueService.getOldestPending();
}

@Patch(':id/processed')
async markProcessed(@Param('id') id: string) {
  return this.queueService.update(id, {
    status: 'processed',
    processing_completed_at: new Date()
  });
}
```

---

### Categoria B: UX/Data

#### 5. Conflito Agendamento Irmãos

**Problema**: Mãe não pode estar em 2 lugares simultaneamente.

**Solução Implementada**:
```typescript
// Nest.js AppointmentsService
async validateNoContactConflict(
  contactId: string, 
  scheduledAt: Date, 
  patientId: string
) {
  const existingAppointments = await this.repo.find({
    where: {
      contact_id: contactId,
      scheduled_at: Between(
        subMinutes(scheduledAt, 60),
        addMinutes(scheduledAt, 60)
      ),
      patient_id: Not(patientId),
      status: Not(In(['cancelled', 'no_show']))
    }
  });
  
  if (existingAppointments.length > 0) {
    const conflict = existingAppointments[0];
    throw new ConflictException({
      message: `Conflito: Você já tem agendamento para ${conflict.patient.name} às ${format(conflict.scheduled_at, 'HH:mm')}.`,
      suggestion: 'Sugerimos horários sequenciais.',
      conflicting_appointment: conflict
    });
  }
}
```

**Na Lívia**:
```
Quando a mãe tem múltiplos filhos, SEMPRE perguntar:

"Você tem 2 crianças para agendar: João e Ana.
Como prefere:

A) Mesmo horário (14h para ambos, com terapeutas diferentes)
B) Sequencial (João 14h, depois Ana 16h)

Responda A ou B"
```

---

#### 6. Confirmação Explícita de Agendamento

**Problema**: Lívia pode "entender errado" e criar agendamento sem aprovação.

**Solução Implementada**:
```typescript
// Tool criar_agendamento
interface CriarAgendamentoInput {
  // ...outros campos
  confirmed_by_contact: true; // Campo OBRIGATÓRIO
}

// Validação no Nest.js
if (!dto.confirmed_by_contact) {
  throw new BadRequestException(
    'Agendamento requer confirmação explícita do contato.'
  );
}
```

**Fluxo da Lívia**:
```
1. Lívia apresenta opções
2. Cliente escolhe horário
3. Lívia SEMPRE faz:

   "Perfeito! Confirmando:
   📅 Terça 10/02 às 14h
   👨‍⚕️ Dra. Ana Maria (Fono - CRFa 2-12345)
   👶 Para: João
   
   Digite CONFIRMAR para eu finalizar o agendamento."

4. SOMENTE após receber "CONFIRMAR" (ou variações):
   - Chamar tool criar_agendamento com confirmed_by_contact: true
```

---

#### 7. Soft Delete + Lixeira (30 dias)

**Problema**: Secretária deleta lead por engano e não consegue recuperar.

**Solução Implementada**:
```sql
-- Todas as tabelas têm deleted_at e deleted_by
ALTER TABLE leads ADD COLUMN deleted_at TIMESTAMP;
ALTER TABLE leads ADD COLUMN deleted_by UUID REFERENCES users(id);

-- View para "Lixeira"
CREATE VIEW trash_bin AS
SELECT 
  'lead' as entity_type,
  id,
  child_name as name,
  deleted_at,
  deleted_by,
  (deleted_at + INTERVAL '30 days') as expires_at
FROM leads 
WHERE deleted_at IS NOT NULL
  AND deleted_at > NOW() - INTERVAL '30 days'

UNION ALL

SELECT 
  'patient' as entity_type,
  id,
  name,
  deleted_at,
  deleted_by,
  (deleted_at + INTERVAL '30 days') as expires_at
FROM patients 
WHERE deleted_at IS NOT NULL
  AND deleted_at > NOW() - INTERVAL '30 days';
```

**Restauração**:
```typescript
@Post(':id/restore')
async restore(@Param('id') id: string, @CurrentUser() user: User) {
  const item = await this.repo.findOne({ 
    where: { id, deleted_at: Not(IsNull()) } 
  });
  
  // Verificar permissão
  if (item.deleted_by !== user.id && user.role !== 'manager') {
    throw new ForbiddenException('Apenas o gestor pode restaurar itens de outros usuários.');
  }
  
  return this.repo.update(id, { 
    deleted_at: null, 
    deleted_by: null 
  });
}
```

---

#### 8. Números Bloqueados/Inativos

**Problema**: Follow-up enviado para número que bloqueou a clínica.

**Solução Implementada**:
```typescript
// Ao enviar via Uazapi
const response = await uazapi.sendMessage(phone, message);

if (response.error) {
  if (response.error.code === 'BLOCKED' || response.error.code === 'INVALID_NUMBER') {
    await this.leadsService.update(leadId, {
      status: 'unreachable',
      lost_reason: 'number_blocked'
    });
    
    // Notificar secretária
    await this.ticketsService.create({
      type: 'notification',
      reason: 'number_unreachable',
      priority: 'low'
    });
  }
}
```

---

#### 9. Feriados Estaduais/Municipais

**Problema**: Sistema não conhece feriados locais.

**Solução Implementada**:
```typescript
// No onboarding do tenant
@Post('tenants')
async create(@Body() dto: CreateTenantDto) {
  const tenant = await this.tenantsService.create(dto);
  
  // Carregar feriados nacionais
  await this.holidaysService.seedNational(tenant.id);
  
  // Se informou cidade/estado, carregar locais via BrasilAPI
  if (dto.city && dto.state) {
    const holidays = await this.brasilApi.getFeriados(dto.state, dto.city);
    await this.holidaysService.seedLocal(tenant.id, holidays);
  }
  
  return tenant;
}

// UI para adicionar feriados custom
// Gestão > Configurações > Feriados
// [ ] 09/07 - Revolução Constitucionalista (SP)
// [ ] 25/01 - Aniversário de São Paulo (Municipal)
// [+] Adicionar feriado personalizado
```

---

#### 10. Transferência de Terapeuta (Wizard)

**Problema**: Terapeuta sai e pacientes ficam órfãos.

**Solução Implementada**:
```typescript
// Wizard Step 1: Listar pacientes afetados
const affectedPatients = await this.appointmentsService.findFutureByTherapist(
  therapistId
);

// Wizard Step 2: Para cada paciente, sugerir novo terapeuta
for (const patient of affectedPatients) {
  const suggestions = await this.therapistsService.findCompatible({
    specialties: patient.therapies,
    availability: patient.preferred_slots,
    excludeId: therapistId
  });
  
  // Classificar por compatibilidade de horário
  for (const therapist of suggestions) {
    const compatibility = await this.checkSlotCompatibility(
      therapist.id,
      patient.current_appointments
    );
    
    therapist.compatibility = compatibility; // 'same_slot', 'different_slot', 'no_slot'
  }
}

// Wizard Step 3: Executar transferências
@Post('transfer')
async transfer(@Body() dto: TransferDto) {
  for (const transfer of dto.transfers) {
    if (transfer.compatibility === 'same_slot') {
      // Auto-transfer
      await this.appointmentsService.bulkUpdateTherapist(
        transfer.patient_id,
        transfer.old_therapist_id,
        transfer.new_therapist_id
      );
    } else {
      // Criar tarefa para secretária
      await this.tasksService.create({
        type: 'reschedule_after_transfer',
        patient_id: transfer.patient_id,
        new_therapist_id: transfer.new_therapist_id,
        priority: 'high'
      });
      
      // Notificar família via Lívia
      await this.n8n.trigger('notify_family_transfer', {
        contact_id: transfer.contact_id,
        message: `Dr. ${oldTherapist.name} não atende mais na clínica. ` +
                 `Transferimos ${patient.name} para ${newTherapist.name}. ` +
                 `O novo horário seria ${newSlot}. Você consegue?`
      });
    }
  }
}
```

---

### Categoria C: Segurança e Auditoria

#### 11. Movimentos Manuais no Kanban (Senha)

**Problema**: Secretária move lead manualmente sem rastreabilidade.

**Solução Implementada**:
```typescript
// Frontend: Modal de confirmação
const handleManualMove = async (leadId: string, newStatus: string) => {
  const result = await showModal({
    title: '⚠️ Movimento Manual',
    message: 'Esta ação será registrada em seu nome.',
    fields: [
      { name: 'password', type: 'password', label: 'Sua senha' },
      { name: 'reason', type: 'text', label: 'Motivo' }
    ]
  });
  
  if (result.confirmed) {
    await api.patch(`/leads/${leadId}/manual-move`, {
      new_status: newStatus,
      password: result.password,
      reason: result.reason
    });
  }
};

// Backend: Validar e auditar
@Patch(':id/manual-move')
async manualMove(@Param('id') id: string, @Body() dto: ManualMoveDto, @CurrentUser() user: User) {
  // Verificar senha
  const isValid = await this.authService.verifyPassword(user.id, dto.password);
  if (!isValid) {
    throw new UnauthorizedException('Senha incorreta');
  }
  
  const lead = await this.leadsService.findOne(id);
  
  // Criar audit log
  await this.auditService.log({
    user_id: user.id,
    action: 'manual_status_change',
    action_source: 'web_app',
    entity_type: 'lead',
    entity_id: id,
    changes: {
      before: { status: lead.status },
      after: { status: dto.new_status },
      manual: true
    },
    reason: dto.reason,
    requires_password: true,
    password_confirmed: true
  });
  
  return this.leadsService.update(id, { status: dto.new_status });
}
```

---

#### 12. Storage Limits (Alertas Super Admin)

**Problema**: Clínicas acumulando GBs de mídia sem controle.

**Solução Implementada**:
```typescript
// Cron job diário
@Cron('0 3 * * *') // 3h da manhã
async checkStorageLimits() {
  const tenants = await this.tenantsService.findAll();
  
  for (const tenant of tenants) {
    const usage = await this.storageService.calculateUsage(tenant.id);
    
    if (usage.bytes > 10 * 1024 * 1024 * 1024) { // 10GB
      await this.notificationsService.notifySuperAdmin({
        type: 'storage_warning',
        tenant_id: tenant.id,
        tenant_name: tenant.name,
        usage_gb: (usage.bytes / 1024 / 1024 / 1024).toFixed(2),
        message: `Clínica ${tenant.name} ultrapassou 10GB de storage.`
      });
    }
    
    // Mover arquivos > 2 anos para cold storage
    const oldFiles = await this.storageService.findOlderThan(tenant.id, '2 years');
    await this.storageService.moveToColdStorage(oldFiles);
  }
}
```

---

## RESUMO DAS SOLUÇÕES

| # | Blind Spot | Solução | Complexidade |
|---|-----------|---------|--------------|
| 1 | Rate Limit Uazapi | Intervalos randômicos, max 6/hora | Baixa |
| 2 | AI Failure | Error trigger, clinic hours check, fallback msg | Média |
| 3 | Race Condition | Locking otimista com X-Expected-Version | Média |
| 4 | Perda de Mensagens | Queue persistente, polling | Alta |
| 5 | Conflito Irmãos | Validação contact_id + horário | Média |
| 6 | Confirmação Explícita | Campo obrigatório confirmed_by_contact | Baixa |
| 7 | Soft Delete | deleted_at + Lixeira 30 dias | Média |
| 8 | Números Bloqueados | Detectar erro Uazapi → status unreachable | Baixa |
| 9 | Feriados Locais | BrasilAPI + UI custom | Média |
| 10 | Transferência Terapeuta | Wizard 3 passos + notificação família | Alta |
| 11 | Auditoria Kanban | Senha + reason + audit_log | Média |
| 12 | Storage Limits | Cron + alerta Super Admin + cold storage | Média |

---

**FIM DO ANEXO C**
