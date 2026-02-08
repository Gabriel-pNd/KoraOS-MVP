# N8N Workflows - Especificação Técnica Completa v3.2
## Anexo Técnico: 5 Core Workflows + Blind Spots

**Data**: 2026-02-08  
**Versão**: 3.2 (Inclui 19 Blind Spots)  

---

## Workflow 1: `fluxo_base` (Orquestrador Principal)

### Trigger
- **Tipo**: Webhook
- **Método**: POST
- **Path**: `/webhook/whatsapp`
- **Payload**: Raw JSON do Uazapi

### Nodes (Sequência)

```
1. [Webhook] webhook_uazapi
   └─ Recebe payload da Uazapi
   └─ Extrai: phone, message, type, media_url, fromMe, timestamp, messageId

2. [HTTP Request] save_to_queue
   └─ POST {{NESTJS_URL}}/api/queue/enqueue
   └─ Body: { raw_payload, phone, tenant_id, external_id: messageId }
   └─ Retorna 200 OK imediato (ACK para Uazapi)
   └─ ⚠️ BLIND SPOT #13: Usa external_id para dedupe

3. [If] check_deduplicated
   └─ Se resposta.deduplicated === true → STOP (já processado)

4. [Function] extract_data
   └─ Extrai: phone, message_text, message_type, media_url
   └─ Detecta tenant_id via phone prefix

5. [HTTP Request] get_contact_context
   └─ GET {{NESTJS_URL}}/api/contacts/by-phone/{{phone}}
   └─ Retorna: contact_id, patients[], active_leads[], conversation_id, 
              human_takeover, conversation_version, last_message_at,
              patients_as_primary[], patients_as_guardian[] (BLIND SPOT #1)

6. [Switch] check_from_me
   └─ Condição: fromMe === true
   └─ Se TRUE e sender != 'ia':
      └─ [HTTP Request] save_human_message
         └─ POST /api/messages { sender: 'secretary', ... }
      └─ [Stop and Error] "Human message saved, no processing needed"

7. [If] check_human_takeover
   └─ Condição: context.human_takeover === true
   └─ Se TRUE:
      └─ [Stop and Error] "Human takeover active, silencing IA"

8. [Wait] debounce_timer
   └─ Duration: 20 seconds
   └─ Propósito: Concatenar mensagens fragmentadas

9. [HTTP Request] get_concatenated_messages
   └─ POST {{NESTJS_URL}}/api/queue/get-concatenated
   └─ Body: { phone, since: now - 25 seconds }
   └─ Retorna: messages[] concatenadas

10. [Execute Workflow] classificacao
    └─ Input: { message_type, raw_content, media_url, mime_type }
    └─ Output: { cleaned_message, stored_path, confidence }
    └─ ⚠️ BLIND SPOT #11: Eager ingestion de mídia

11. [If] check_media_expired
    └─ Se output.error === 'MEDIA_EXPIRED':
       └─ Responder: output.fallbackMessage
       └─ STOP

12. [HTTP Request] get_conversation_history
    └─ GET /api/conversations/{{conversation_id}}/history?limit=20
    └─ Retorna: últimas 20 mensagens para contexto

13. [HTTP Request] get_current_version
    └─ GET /api/conversations/{{conversation_id}}/version
    └─ Salva: version_at_start = response.version
    └─ ⚠️ BLIND SPOT #4: Guardar versão para last-mile check

14. [OpenAI Chat Model] livia_agent
    └─ Model: gpt-4o
    └─ Temperature: 0.7
    └─ System Prompt: [Ver seção SYSTEM PROMPT abaixo]
    └─ Tools: [Ver seção TOOLS abaixo]
    └─ Messages: conversation_history + cleaned_message

15. [Switch] check_tool_calls
    └─ Se tool = escalar_para_humano:
       └─ [HTTP Request] create_ticket
          └─ POST /api/tickets { reason, priority: 'urgent' }
       └─ [HTTP Request] set_human_takeover (BLIND SPOT #9: Com deadline)
          └─ PATCH /api/leads/{{lead_id}} { 
               human_takeover: true,
               human_takeover_deadline: NOW() + 15min (se frustração) ou 60min
             }
       └─ [Set] response = "Vou transferir você para nossa equipe..."
    └─ Se tool = criar_agendamento:
       └─ ⚠️ BLIND SPOT #4: Last-mile check antes de executar
       └─ [HTTP Request] check_version
          └─ GET /api/conversations/{{conversation_id}}/version
          └─ Se version != version_at_start → STOP & reprocessar
       └─ Verificar confirmed_by_contact === true (BLIND SPOT #18)
       └─ [Execute Workflow] gestao_agenda { action: 'agendar', ... }
    └─ Outros tools: executar via HTTP para Nest.js

16. [Function] prepare_response
    └─ Se response.length > 300:
       └─ Dividir em blocos por parágrafo
       └─ Retornar array de chunks
    └─ Senão: retornar [response]

17. [Loop] send_response_chunks
    └─ Para cada chunk:
       └─ [Function] calculate_delay
          └─ base_delay = Math.max(5000, chunk.length * 200)
          └─ random_factor = 0.7 + Math.random() * 0.6 (±30%)
          └─ final_delay = base_delay * random_factor
       └─ [Wait] final_delay
       └─ [HTTP Request] send_whatsapp
          └─ POST {{UAZAPI_URL}}/message/text
          └─ Body: { phone, message: chunk }
       └─ [HTTP Request] save_sent_message
          └─ POST /api/messages { sender: 'ia', message_text: chunk }

18. [HTTP Request] mark_queue_processed
    └─ PATCH /api/queue/{{queue_id}} { status: 'processed' }
```

### Error Handling

```
[Error Trigger] on_error
└─ Captura qualquer erro no workflow
└─ [HTTP Request] check_clinic_hours
   └─ GET /api/clinic-hours/is-open
└─ [Switch] clinic_open
   └─ Se ABERTA:
      └─ Apenas criar ticket urgente
      └─ POST /api/tickets { type: 'system_error', reason: 'ai_failure' }
   └─ Se FECHADA:
      └─ Criar ticket + enviar mensagem
      └─ POST /uazapi/send { message: "Estou com uma instabilidade técnica momentânea. Já avisei nossa equipe e retornaremos em breve! 😊" }
      └─ POST /api/tickets { ... }
```

### Message Delete/Edit Handler (BLIND SPOT #10)

```
[Webhook] webhook_message_revoked
└─ Trigger: POST /webhook/message-revoked
└─ [HTTP Request] revoke_message
   └─ POST {{NESTJS_URL}}/api/messages/revoke
   └─ Body: { external_id: payload.messageId }
```

---

## Workflow 2: `classificacao` (Media Processor)

### Trigger
- **Tipo**: Execute Workflow Trigger
- **Chamado por**: fluxo_base

### Input
```json
{
  "message_type": "text" | "audio" | "image" | "document",
  "raw_content": "texto ou URL",
  "media_url": "https://...",
  "mime_type": "audio/ogg" | "image/jpeg" | "application/pdf"
}
```

### Nodes

```
1. [Switch] message_type_router
   └─ Condições: text, audio, image, document

--- BRANCH: text ---
2a. [Set] return_text
    └─ cleaned_message = raw_content
    └─ original_type = 'text'
    └─ confidence = 1.0

--- BRANCH: audio ---
2b. [HTTP Request] download_audio
    └─ GET media_url
    └─ Timeout: 30s
    └─ Binary response

3b. [If] check_content_type (BLIND SPOT #11)
    └─ Se response.headers['content-type'].includes('text/html'):
       └─ [Set] return_expired
          └─ error = 'MEDIA_EXPIRED'
          └─ fallbackMessage = 'Não consegui acessar a mídia enviada. Pode reenviar, por favor?'
       └─ RETURN

4b. [HTTP Request] upload_to_storage
    └─ POST {{SUPABASE_URL}}/storage/v1/object/media/{{path}}
    └─ Salva no Supabase Storage
    └─ Retorna: stored_path

5b. [OpenAI Transcription] whisper_transcribe
    └─ Model: whisper-1
    └─ Audio: binary do passo 2b
    └─ Language: pt
    └─ Retorna: text, confidence

6b. [HTTP Request] save_transcription
    └─ PATCH /api/messages/{{message_id}}
    └─ Body: { transcription, transcription_confidence, stored_media_path }

7b. [Set] return_audio
    └─ cleaned_message = transcription
    └─ original_type = 'audio'
    └─ stored_path = from step 4b
    └─ confidence = whisper_confidence

--- BRANCH: image ---
(Similar flow with Content-Type validation)

--- BRANCH: document ---
(Similar flow with Content-Type validation)
```

### Output
```json
{
  "cleaned_message": "Texto processado e estruturado",
  "original_type": "audio",
  "stored_path": "/media/tenant-abc/audio_123.ogg",
  "confidence": 0.95,
  "vision_analysis": null | "Análise da imagem...",
  "error": null | "MEDIA_EXPIRED"
}
```

---

## Workflow 3: `gestao_agenda` (API Bridge)

### Trigger
- **Tipo**: Execute Workflow Trigger
- **Chamado por**: fluxo_base (via tools da Lívia)

### Input
```json
{
  "action": "consultar" | "agendar" | "reagendar" | "cancelar",
  "tenant_id": "uuid",
  "contact_id": "uuid",
  "patient_ids": ["uuid1", "uuid2"],
  "therapy_types": ["ABA", "Fono"],
  "preferred_dates": ["2026-02-10", "2026-02-11"],
  "logistics_preference": "same_time" | "sequential",
  "appointment_id": "uuid",
  "new_scheduled_at": "2026-02-12T14:00:00",
  "confirmed_by_contact": true,
  "reason": "string",
  "idempotency_key": "string",
  "version_at_start": 5
}
```

### Nodes por Action

#### ACTION: consultar

```
1. [HTTP Request] get_availability
   └─ POST {{NESTJS_URL}}/api/appointments/availability
   └─ Body: { patient_ids, therapy_types, preferred_dates, logistics_preference, contact_id }

2. [Function] format_options
   └─ Backend retorna opções rankeadas por qualidade de logística:
      - Nível 1 (optimal): Mesmo dia, horários sequenciais
      - Nível 2 (good): Mesmo dia, horários espaçados
      - Nível 3 (acceptable): Dias diferentes

3. [Set] return_availability
   └─ Formatar para Lívia apresentar ao cliente
```

#### ACTION: agendar

```
1. [HTTP Request] check_version (BLIND SPOT #4)
   └─ GET /api/conversations/{{conversation_id}}/version
   └─ Se version != version_at_start:
      └─ [Set] error = { aborted: true, reason: 'new_message_detected' }
      └─ RETURN

2. [If] check_confirmation (BLIND SPOT #18)
   └─ Condição: confirmed_by_contact === true
   └─ Se FALSE:
      └─ [Stop and Error] "Confirmação do contato obrigatória"

3. [HTTP Request] validate_conflicts (BLIND SPOT #6)
   └─ POST {{NESTJS_URL}}/api/appointments/validate
   └─ Body: { patient_ids, scheduled_times, therapist_ids, contact_id }
   └─ Retorna: { valid: bool, conflicts: [] }
   └─ ⚠️ Backend usa constraint EXCLUDE para validar

4. [If] has_conflicts
   └─ Se conflicts.length > 0:
      └─ [Set] error_response
         └─ "Conflito detectado: [terapeuta X já tem agendamento nesse horário]"
      └─ [Stop and Error]

5. [HTTP Request] create_appointments (BLIND SPOT #7: Two-phase)
   └─ POST {{NESTJS_URL}}/api/appointments/batch
   └─ Headers: { 'X-Idempotency-Key': idempotency_key } (BLIND SPOT #6)
   └─ Body: { 
        appointments: [...], 
        created_by_source: 'ia',
        status: 'pending_confirmation'
      }

6. [HTTP Request] update_lead_status
   └─ PATCH /api/leads/{{lead_id}}
   └─ Body: { status: 'agendado' }

7. [Set] return_success
   └─ "Agendamento confirmado:
       - João: Terça 10/02 às 14h com Dra. Ana (CRFa 2-12345)
       - Ana: Terça 10/02 às 16h com Dr. Pedro (CRP 06/54321)"
```

#### ACTION: reagendar

```
(Similar com version check e idempotency)
```

#### ACTION: cancelar

```
(Similar com version check)
```

---

## Workflow 4: `follow_up` (Reativação Escalonada)

### Trigger
- **Tipo**: Cron
- **Expression**: `*/10 12-17 * * 1-6`
- **Descrição**: A cada 10 min, das 12h às 17h, Segunda a Sábado

### Nodes

```
1. [HTTP Request] check_today_holiday
   └─ GET {{NESTJS_URL}}/api/holidays/today
   └─ Se hoje é feriado → STOP

2. [Code Node] check_is_sunday
   └─ Se dayOfWeek === 0 → STOP

3. [HTTP Request] get_pending_followups
   └─ GET /api/leads/pending-followup
   └─ Query: {
        status: 'follow_up',
        human_takeover: false,
        next_followup_at_lte: NOW(),
        converted_to_patient_id: NULL, // BLIND SPOT #8: State guard
        order_by: 'created_at ASC', // Oldest first
        limit: 1
      }

4. [If] has_lead
   └─ Se leads.length === 0 → STOP

5. [If] check_already_converted (BLIND SPOT #8: Double check)
   └─ Se lead.converted_to_patient_id !== null:
      └─ [HTTP Request] cancel_followups
         └─ POST /api/leads/{{lead_id}}/cancel-all-followups
      └─ STOP

6. [HTTP Request] check_active_conversation (BLIND SPOT #14)
   └─ GET /api/conversations/{{conversation_id}}
   └─ minutes_since_last = (NOW - last_message_at) / 60000
   └─ Se minutes_since_last < 15:
      └─ STOP (conversa ativa, não interromper)

7. [HTTP Request] get_conversation_context
   └─ GET /api/conversations/{{conversation_id}}/history?limit=10

8. [Function] determine_followup_stage
   └─ Lê followup_stage atual
   └─ Calcula dias desde last_interaction_at
   └─ Determina qual é a próxima mensagem apropriada

9. [OpenAI Chat] generate_contextual_message
   └─ System: "Você é a Lívia, assistente da clínica X. 
        Você está fazendo follow-up com {{contact.name}}.
        Ela estava interessada em terapias para {{lead.child_name}}.
        
        Última conversa foi há {{days}} dias.
        Resumo da última conversa: {{summary}}
        
        Crie uma mensagem de reengajamento NATURAL e CONTEXTUAL.
        - NÃO seja genérica ('Oi, tudo bem?')
        - Referencie a conversa anterior
        - Seja empática e breve (max 2 parágrafos)
        - Pergunte se ainda tem interesse
        
        Stage atual: {{stage}} (1=24h, 2=72h, 3=7d, 4=30d, 5=60d, 6=90d)"

10. [HTTP Request] check_rate_limit
    └─ GET /api/rate-limits/{{phone}}/can-send
    └─ Se false → STOP (aguardar próximo ciclo)

11. [Function] calculate_random_delay
    └─ base_interval = 600000 / expected_leads_per_hour
    └─ random_factor = 0.5 + Math.random()
    └─ delay = base_interval * random_factor

12. [Wait] random_delay

13. [HTTP Request] send_whatsapp
    └─ POST {{UAZAPI_URL}}/message/text
    └─ Body: { phone, message }

14. [HTTP Request] save_message
    └─ POST /api/messages { sender: 'ia', ... }

15. [HTTP Request] update_lead_followup
    └─ PATCH /api/leads/{{lead_id}}
    └─ Body: { 
         followup_stage: stage + 1, 
         last_followup_at: NOW()
       }

16. [HTTP Request] increment_rate_limit
    └─ POST /api/rate-limits/{{phone}}/increment
```

---

## Workflow 5: `enviar_lembrete` (Confirmação de Agendamentos)

### Trigger
- **Tipo**: Cron
- **Expression**: `*/3 9-12 * * *`
- **Descrição**: A cada 3 min, das 9h às 12h, todos os dias

### Nodes

```
1. [Function] calculate_target_date (BLIND SPOT #15: Timezone-aware)
   └─ const tenant = await getTenant();
   └─ const now = utcToZonedTime(new Date(), tenant.timezone);
   └─ const dayOfWeek = now.getDay();
   └─ 
   └─ if (dayOfWeek === 6) { // Sábado
   └─   target = addDays(now, 2); // Segunda
   └─ } else if (dayOfWeek === 0) { // Domingo
   └─   return { skip: true };
   └─ } else {
   └─   target = addDays(now, 1); // Amanhã
   └─ }
   └─ return { target_date: format(target, 'yyyy-MM-dd') };

2. [If] is_sunday
   └─ Se skip === true → STOP

3. [HTTP Request] check_target_holiday
   └─ GET /api/holidays/{{target_date}}
   └─ Se é feriado → STOP

4. [HTTP Request] get_pending_confirmations
   └─ GET /api/appointments/pending-confirmation
   └─ Query: {
        scheduled_date: target_date,
        confirmation_status: 'pending',
        confirmation_sent_at: null,
        order_by: 'scheduled_at ASC',
        limit: 1
      }

5. [If] has_appointment
   └─ Se appointments.length === 0 → STOP

6. [HTTP Request] get_appointment_details
   └─ GET /api/appointments/{{appointment_id}}/full
   └─ Retorna: patient, contact, therapist (com council_number)

7. [Function] build_reminder_message
   └─ message = `Olá ${contact.name}! 👋
   └─ 
   └─ Lembrete da sessão de ${patient.name} amanhã:
   └─ 📅 ${formatDate(scheduled_at)} às ${formatTime(scheduled_at)}
   └─ 👨‍⚕️ ${therapist.full_name} (${specialty.council_type} ${specialty.council_number})
   └─ 
   └─ Para confirmar, responda CONFIRMAR.
   └─ Para reagendar, responda REAGENDAR.`;

8. [HTTP Request] send_whatsapp
   └─ POST {{UAZAPI_URL}}/message/text
   └─ Body: { phone: contact.phone, message }

9. [HTTP Request] mark_confirmation_sent (BLIND SPOT #7: Two-phase)
   └─ PATCH /api/appointments/{{appointment_id}}
   └─ Body: { 
        confirmation_sent_at: NOW(),
        confirmation_message_status: 'sent'
      }

10. [HTTP Request] save_message
    └─ POST /api/messages { sender: 'ia', message_text: message }
```

---

## Workflow 6: `check_takeover_deadlines` (BLIND SPOT #9)

### Trigger
- **Tipo**: Cron
- **Expression**: `*/5 * * * *`
- **Descrição**: A cada 5 minutos, sempre

### Nodes

```
1. [HTTP Request] get_overdue_takeowers
   └─ GET {{NESTJS_URL}}/api/leads/overdue-takeovers
   └─ Query: { human_takeover: true, deadline_lte: NOW() }

2. [Loop] process_each_overdue
   └─ Para cada lead:
      └─ [Switch] escalation_level

      └─ Case 0 (Normal):
         └─ [HTTP Request] notify_secretary
            └─ POST /api/notifications { type: 'urgent', message: 'Conversa aguardando há muito tempo' }
         └─ [HTTP Request] escalate
            └─ PATCH /api/leads/{{lead_id}} { 
                 escalation_level: 1, 
                 human_takeover_deadline: NOW() + 15min 
               }

      └─ Case 1 (Secretária alertada):
         └─ [HTTP Request] notify_manager
            └─ POST /api/notifications { type: 'critical', ... }
         └─ [HTTP Request] escalate
            └─ PATCH /api/leads/{{lead_id}} { 
                 escalation_level: 2, 
                 human_takeover_deadline: NOW() + 30min 
               }

      └─ Case 2 (Manager alertado):
         └─ [HTTP Request] send_auto_reply
            └─ POST {{UAZAPI_URL}}/message/text
            └─ Body: { phone, message: 'Desculpe a demora! Nossa equipe está analisando...' }
         └─ [HTTP Request] return_to_ia
            └─ PATCH /api/leads/{{lead_id}} { 
                 human_takeover: false, 
                 escalation_level: 3 
               }
```

---

## Variáveis de Ambiente

```env
# Nest.js Backend
NESTJS_URL=https://api.kora.ai

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGc...

# Uazapi
UAZAPI_URL=https://api.uazapi.com.br
UAZAPI_TOKEN=abc123...
UAZAPI_INSTANCE=clinica-abc

# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_ORG_ID=org-...

# Rate Limits
MAX_MESSAGES_PER_HOUR=6
MIN_DELAY_SECONDS=5
```

---

## System Prompt da Lívia (v3.2 com Blind Spots)

```
Você é a Lívia, assistente virtual da {{clinic.name}}.

CONTEXTO ATUAL:
- Contato: {{contact.name}} ({{contact.phone}})
- Relacionamento: {{contact.relationship_type}}
{{#if patients_as_primary.length}}
- Pacientes (responsável principal): {{#each patients_as_primary}}{{name}} ({{age}} anos){{#unless @last}}, {{/unless}}{{/each}}
{{/if}}
{{#if patients_as_guardian.length}}
- Pacientes (responsável secundário): {{#each patients_as_guardian}}{{name}}{{#unless @last}}, {{/unless}}{{/each}}
  ⚠️ Verificar permissões antes de cada ação
{{/if}}
{{#if leads.length}}
- Leads em negociação: {{#each leads}}{{child_name}} ({{status}}){{#unless @last}}, {{/unless}}{{/each}}
{{/if}}

REGRAS CRÍTICAS DE COMPORTAMENTO:

1. NUNCA pergunte informações já fornecidas (consulte o contexto).

2. Seja natural e empática, não robótica.

3. Se o contato tem múltiplos filhos, SEMPRE especifique para qual.

4. ⚠️ CONFIRMAÇÃO EXPLÍCITA OBRIGATÓRIA (BLIND SPOT #18):
   Mensagens curtas ou ambíguas ("ok", "sim", "pode ser", "👍") 
   NÃO PODEM disparar side-effects (criar agendamento, cancelar, editar).
   
   Quando receber resposta curta APÓS apresentar opções, você DEVE reconfirmar:
   "Só para confirmar: você quer agendar para Terça 10/02 às 14h 
   com a Dra. Ana, correto? Digite CONFIRMAR para eu finalizar."
   
   Só execute a ação após receber "CONFIRMAR", "CONFIRMADO", ou "CONFIRMA".

5. ⚠️ MENSAGEM REMOVIDA (BLIND SPOT #10):
   Se você receber no histórico uma mensagem marcada como 
   "[MENSAGEM REMOVIDA PELO USUÁRIO]", NÃO faça referência ao conteúdo anterior. 
   Trate como se a mensagem nunca tivesse existido.

QUANDO AGENDAR PARA IRMÃOS:
- Pergunte: "Como você prefere: todos no mesmo horário ou em horários sequenciais?"
- Valide que a mãe pode levar ambos (não pode estar em dois lugares ao mesmo tempo).

TRIAGEM (coletar naturalmente, sem interrogatório):
- Nome do responsável
- Nome da criança
- Idade
- Diagnóstico (se tiver laudo, peça para enviar foto/PDF)
- Dias/horários de preferência
- Forma de pagamento: particular, convênio ou reembolso

ESCALAÇÃO PARA HUMANO:
- Se detectar frustração ou raiva
- Se não entender a mensagem 2 vezes seguidas
- Se o cliente pedir explicitamente para falar com humano
- Se comportamento suspeito (spam, ofensas)

FERRAMENTAS DISPONÍVEIS:
- consultar_disponibilidade: Verificar horários
- criar_agendamento: Criar (SOMENTE após confirmação explícita)
- reagendar_appointment: Mudar data/hora
- cancelar_appointment: Cancelar
- atualizar_lead_status: Mudar status no pipeline
- escalar_para_humano: Transferir para secretária

FORMATO DE RESPOSTA:
- Seja concisa (máx 3 parágrafos)
- Use emojis com moderação (1-2 por mensagem)
- Trate cliente pelo primeiro nome
```

---

## Checklist de Implementação por Workflow

| Workflow | Blind Spots Implementados |
|----------|--------------------------|
| fluxo_base | #4, #10, #13, #17, #18 |
| classificacao | #11 |
| gestao_agenda | #4, #6, #7, #18 |
| follow_up | #8, #14 |
| enviar_lembrete | #7, #15 |
| check_takeover_deadlines | #9 |

---

**FIM DO ANEXO N8N WORKFLOWS v3.2**
