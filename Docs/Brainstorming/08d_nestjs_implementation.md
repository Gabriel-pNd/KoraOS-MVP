# NestJS Implementation Guide - Blind Spots v3.2
## Anexo D: Serviços, Middlewares e Guards

**Data**: 2026-02-08  
**Versão**: 3.2 (19 Blind Spots)

---

## 1. Tenant Isolation Middleware (Blind Spot #2)

```typescript
// src/common/middleware/tenant.middleware.ts
import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { SupabaseService } from '../services/supabase.service';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly supabase: SupabaseService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const tenantId = req.headers['x-tenant-id'] as string || req.user?.tenant_id;
    
    if (!tenantId) {
      throw new ForbiddenException('Tenant ID required');
    }
    
    // Set session variable for RLS
    await this.supabase.rpc('set_current_tenant', { p_tenant_id: tenantId });
    
    req.tenantId = tenantId;
    next();
  }
}
```

---

## 2. PII Sanitizer (Blind Spot #3)

```typescript
// src/common/utils/sanitizer.ts
const PII_FIELDS = [
  'diagnosis', 'medical_notes', 'diagnosis_documents',
  'insurance_number', 'birth_date', 'phone', 'email',
  'transcription', 'vision_analysis', 'message_text',
  'raw_payload', 'child_name', 'name'
];

export function sanitizeForLog(obj: any): any {
  if (!obj) return obj;
  if (typeof obj !== 'object') return obj;
  
  const sanitized = Array.isArray(obj) ? [...obj] : { ...obj };
  
  for (const field of PII_FIELDS) {
    if (sanitized[field]) {
      if (typeof sanitized[field] === 'string') {
        sanitized[field] = `[REDACTED:${field}:${sanitized[field].length}chars]`;
      } else {
        sanitized[field] = '[REDACTED]';
      }
    }
  }
  
  // Recursive for nested objects
  for (const key of Object.keys(sanitized)) {
    if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeForLog(sanitized[key]);
    }
  }
  
  return sanitized;
}

// Usage in global logger interceptor
// logger.info('Processing', sanitizeForLog(payload));
```

---

## 3. Tool Execution Guard (Blind Spot #4)

```typescript
// src/common/guards/tool-execution.guard.ts
import { Injectable, ConflictException } from '@nestjs/common';
import { ConversationsService } from '../../conversations/conversations.service';

export interface ExecutionResult<T> {
  success: true;
  data: T;
} | {
  success: false;
  aborted: true;
  reason: string;
};

@Injectable()
export class ToolExecutionGuard {
  constructor(private readonly conversationsService: ConversationsService) {}

  async executeWithVersionCheck<T>(
    conversationId: string,
    versionAtStart: number,
    action: () => Promise<T>
  ): Promise<ExecutionResult<T>> {
    // Check if new messages arrived
    const current = await this.conversationsService.findOne(conversationId);
    
    if (current.version !== versionAtStart) {
      return {
        success: false,
        aborted: true,
        reason: `Nueva mensaje detectada. Version: ${versionAtStart} → ${current.version}`
      };
    }
    
    const result = await action();
    return { success: true, data: result };
  }
}
```

---

## 4. Idempotency Service (Blind Spot #6)

```typescript
// src/common/services/idempotency.service.ts
import { Injectable } from '@nestjs/common';
import { RedisService } from './redis.service';

@Injectable()
export class IdempotencyService {
  constructor(private readonly redis: RedisService) {}

  /**
   * Check if operation was already executed
   * Returns true if this is a NEW operation (proceed)
   * Returns false if DUPLICATE (skip)
   */
  async checkAndSet(key: string, ttlSeconds: number = 300): Promise<boolean> {
    const result = await this.redis.set(
      `idempotency:${key}`,
      Date.now().toString(),
      'EX', ttlSeconds,
      'NX' // Only set if not exists
    );
    return result === 'OK';
  }

  async invalidate(key: string): Promise<void> {
    await this.redis.del(`idempotency:${key}`);
  }
}
```

---

## 5. Contact Mutex Service (Blind Spot #17)

```typescript
// src/common/services/contact-mutex.service.ts
import { Injectable, ConflictException } from '@nestjs/common';
import { RedisService } from './redis.service';

@Injectable()
export class ContactMutexService {
  constructor(private readonly redis: RedisService) {}
  
  async acquireLock(
    contactId: string, 
    ttlMs: number = 30000
  ): Promise<() => Promise<void>> {
    const lockKey = `lock:contact:${contactId}`;
    const lockValue = `${Date.now()}:${Math.random().toString(36)}`;
    
    // Try to acquire with exponential backoff
    let acquired = false;
    for (let attempt = 0; attempt < 10; attempt++) {
      acquired = await this.redis.set(lockKey, lockValue, 'PX', ttlMs, 'NX') === 'OK';
      if (acquired) break;
      await new Promise(r => setTimeout(r, 100 * Math.pow(1.5, attempt)));
    }
    
    if (!acquired) {
      throw new ConflictException(`Could not acquire lock for contact ${contactId}`);
    }
    
    // Return release function
    return async () => {
      const current = await this.redis.get(lockKey);
      if (current === lockValue) {
        await this.redis.del(lockKey);
      }
    };
  }

  async withLock<T>(
    contactId: string, 
    action: () => Promise<T>
  ): Promise<T> {
    const release = await this.acquireLock(contactId);
    try {
      return await action();
    } finally {
      await release();
    }
  }
}
```

---

## 6. Queue Service (Blind Spots #13, #19)

```typescript
// src/queue/queue.service.ts
import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { MessageQueue } from './entities/message-queue.entity';
import { TenantsService } from '../tenants/tenants.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class QueueService {
  constructor(
    @InjectRepository(MessageQueue)
    private readonly repo: Repository<MessageQueue>,
    private readonly tenantsService: TenantsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async enqueue(payload: any): Promise<{ queued: boolean; reason?: string }> {
    const tenantId = payload.tenant_id;
    const externalId = payload.message?.id || payload.key?.id;
    
    // Check queue size limit (Blind Spot #19)
    const tenant = await this.tenantsService.findOne(tenantId);
    const currentSize = await this.repo.count({
      where: { 
        tenant_id: tenantId,
        status: In(['pending', 'processing'])
      }
    });
    
    if (currentSize >= tenant.max_queue_size) {
      // Move to dead-letter
      await this.repo.save({
        tenant_id: tenantId,
        external_id: externalId,
        raw_payload: payload,
        phone: payload.phone,
        status: 'dead_letter',
        dead_letter_reason: 'queue_full'
      });
      
      await this.notificationsService.alertSuperAdmin({
        type: 'queue_overflow',
        tenant_id: tenantId,
        current_size: currentSize
      });
      
      return { queued: false, reason: 'queue_full' };
    }
    
    // Alert on threshold (Blind Spot #19)
    if (currentSize >= tenant.queue_alert_threshold) {
      await this.notificationsService.alertManager({
        type: 'queue_warning',
        tenant_id: tenantId,
        current_size: currentSize,
        threshold: tenant.queue_alert_threshold
      });
    }
    
    // Dedupe by external_id (Blind Spot #13)
    try {
      const result = await this.repo
        .createQueryBuilder()
        .insert()
        .into(MessageQueue)
        .values({
          tenant_id: tenantId,
          external_id: externalId,
          raw_payload: payload,
          phone: payload.phone,
          status: 'pending'
        })
        .onConflict(`(tenant_id, external_id) WHERE status != 'dead_letter' DO NOTHING`)
        .execute();
      
      if (result.raw.length === 0) {
        return { queued: false, reason: 'duplicate' };
      }
      
      return { queued: true };
    } catch (error) {
      if (error.code === '23505') { // unique_violation
        return { queued: false, reason: 'duplicate' };
      }
      throw error;
    }
  }
}
```

---

## 7. Leads Service (Blind Spots #8, #16)

```typescript
// src/leads/leads.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lead } from './entities/lead.entity';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class LeadsService {
  constructor(
    @InjectRepository(Lead)
    private readonly repo: Repository<Lead>,
    private readonly auditService: AuditService,
  ) {}

  // Blind Spot #16: Find including soft-deleted
  async findOrCreate(contactId: string, childName: string): Promise<Lead> {
    // First: search including deleted
    let lead = await this.repo.findOne({
      where: { 
        contact_id: contactId,
        child_name: childName
      },
      withDeleted: true
    });
    
    if (lead) {
      if (lead.deleted_at) {
        // Reactivate existing lead
        await this.repo.update(lead.id, {
          deleted_at: null,
          status: 'novo',
          reactivated_at: new Date(),
          reactivation_count: lead.reactivation_count + 1
        });
        
        await this.auditService.log({
          action: 'lead_reactivated',
          entity_type: 'lead',
          entity_id: lead.id,
          changes: { reactivation_count: lead.reactivation_count + 1 }
        });
        
        // Refresh entity
        lead = await this.repo.findOne({ where: { id: lead.id } });
      }
      return lead;
    }
    
    // Create new only if truly doesn't exist
    return this.repo.save({ 
      contact_id: contactId, 
      child_name: childName,
      status: 'novo'
    });
  }

  // Blind Spot #8: Cancel all followups when converted
  async cancelAllFollowups(leadId: string): Promise<void> {
    await this.repo.update(leadId, {
      next_followup_at: null,
      status: 'convertido'
    });
    
    await this.auditService.log({
      action: 'followups_cancelled',
      entity_type: 'lead',
      entity_id: leadId,
      changes: { reason: 'converted_to_patient' }
    });
  }

  // Blind Spot #14: Check if conversation is active
  async canSendFollowup(leadId: string): Promise<boolean> {
    const lead = await this.repo.findOne({
      where: { id: leadId },
      relations: ['contact', 'contact.conversations']
    });
    
    if (!lead || lead.converted_to_patient_id) {
      return false;
    }
    
    const lastConversation = lead.contact.conversations?.[0];
    if (!lastConversation) return true;
    
    const minutesSinceLastMessage = 
      (Date.now() - new Date(lastConversation.last_message_at).getTime()) / 60000;
    
    // Don't send if conversation active in last 15 minutes
    return minutesSinceLastMessage >= 15;
  }
}
```

---

## 8. Messages Service (Blind Spot #10)

```typescript
// src/messages/messages.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConversationMessage } from './entities/conversation-message.entity';
import { RedisService } from '../common/services/redis.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(ConversationMessage)
    private readonly repo: Repository<ConversationMessage>,
    private readonly redis: RedisService,
    private readonly auditService: AuditService,
  ) {}

  // Blind Spot #10: Handle message revocation
  async revokeByExternalId(externalId: string): Promise<void> {
    const message = await this.repo.findOne({ 
      where: { external_id: externalId } 
    });
    
    if (!message) return;
    
    // Soft delete + clear sensitive content
    await this.repo.update(message.id, {
      deleted_at: new Date(),
      revoked_by_user: true,
      message_text: '[MENSAGEM REMOVIDA PELO USUÁRIO]',
      transcription: null,
      vision_analysis: null
    });
    
    // Invalidate conversation context cache
    await this.redis.del(`context:${message.conversation_id}`);
    
    await this.auditService.log({
      action: 'message_revoked_by_user',
      entity_type: 'message',
      entity_id: message.id,
      action_source: 'webhook'
    });
  }
}
```

---

## 9. Media Service (Blind Spot #11)

```typescript
// src/media/media.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { SupabaseService } from '../common/services/supabase.service';
import { firstValueFrom } from 'rxjs';

export interface MediaDownloadResult {
  success: true;
  storedPath: string;
  mimeType: string;
  sizeBytes: number;
} | {
  success: false;
  error: 'MEDIA_EXPIRED' | 'DOWNLOAD_FAILED';
  fallbackMessage: string;
};

@Injectable()
export class MediaService {
  constructor(
    private readonly http: HttpService,
    private readonly supabase: SupabaseService,
  ) {}

  // Blind Spot #11: Eager ingestion with Content-Type validation
  async downloadAndStore(
    mediaUrl: string, 
    expectedMimeType: string,
    tenantId: string
  ): Promise<MediaDownloadResult> {
    try {
      const response = await firstValueFrom(
        this.http.get(mediaUrl, { 
          responseType: 'arraybuffer',
          timeout: 30000
        })
      );
      
      // Validate Content-Type (Blind Spot #11)
      const actualContentType = response.headers['content-type'];
      if (actualContentType?.includes('text/html')) {
        return {
          success: false,
          error: 'MEDIA_EXPIRED',
          fallbackMessage: 'Não consegui acessar a mídia enviada. Pode reenviar, por favor?'
        };
      }
      
      // Validate size
      const sizeBytes = response.data.byteLength;
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (sizeBytes > maxSize) {
        return {
          success: false,
          error: 'DOWNLOAD_FAILED',
          fallbackMessage: 'O arquivo é muito grande. O limite é 50MB.'
        };
      }
      
      // Upload to Supabase Storage
      const extension = expectedMimeType.split('/')[1] || 'bin';
      const filename = `${Date.now()}_${Math.random().toString(36).slice(2)}.${extension}`;
      const path = `media/${tenantId}/${filename}`;
      
      const { error } = await this.supabase.storage
        .from('media')
        .upload(path, response.data, {
          contentType: expectedMimeType,
          upsert: false
        });
      
      if (error) throw error;
      
      return {
        success: true,
        storedPath: path,
        mimeType: expectedMimeType,
        sizeBytes
      };
      
    } catch (error) {
      return {
        success: false,
        error: 'DOWNLOAD_FAILED',
        fallbackMessage: 'Não consegui processar a mídia. Por favor, tente novamente.'
      };
    }
  }
}
```

---

## 10. Takeover Checker Service (Blind Spot #9)

```typescript
// src/leads/takeover-checker.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Lead } from './entities/lead.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { addMinutes } from 'date-fns';

@Injectable()
export class TakeoverCheckerService {
  private readonly logger = new Logger(TakeoverCheckerService.name);

  constructor(
    @InjectRepository(Lead)
    private readonly leadsRepo: Repository<Lead>,
    private readonly notificationsService: NotificationsService,
    private readonly whatsappService: WhatsAppService,
  ) {}

  // Blind Spot #9: Check every 5 minutes
  @Cron(CronExpression.EVERY_5_MINUTES)
  async checkTakeoverDeadlines() {
    const overdue = await this.leadsRepo.find({
      where: {
        human_takeover: true,
        human_takeover_deadline: LessThan(new Date())
      },
      relations: ['contact']
    });

    for (const lead of overdue) {
      try {
        await this.processOverdueTakeover(lead);
      } catch (error) {
        this.logger.error(`Failed to process takeover for lead ${lead.id}`, error);
      }
    }
  }

  private async processOverdueTakeover(lead: Lead) {
    switch (lead.escalation_level) {
      case 0:
        // Level 1: Alert secretary
        await this.notificationsService.notifySecretary(lead.tenant_id, {
          type: 'urgent',
          title: 'Conversa aguardando',
          message: `${lead.contact.name} está esperando há muito tempo`,
          lead_id: lead.id
        });
        
        await this.leadsRepo.update(lead.id, {
          escalation_level: 1,
          human_takeover_deadline: addMinutes(new Date(), 15)
        });
        break;

      case 1:
        // Level 2: Alert manager
        await this.notificationsService.notifyManager(lead.tenant_id, {
          type: 'critical',
          title: 'Conversa crítica sem resposta',
          message: `${lead.contact.name} sem resposta humana`,
          lead_id: lead.id
        });
        
        await this.leadsRepo.update(lead.id, {
          escalation_level: 2,
          human_takeover_deadline: addMinutes(new Date(), 30)
        });
        break;

      case 2:
        // Level 3: Auto-reply + return to AI
        await this.whatsappService.sendText(lead.contact.phone,
          'Desculpe a demora! Nossa equipe está analisando sua solicitação. ' +
          'Retornaremos em breve. Enquanto isso, posso ajudar com algo mais?'
        );
        
        await this.leadsRepo.update(lead.id, {
          human_takeover: false,
          escalation_level: 3
        });
        break;
    }
  }
}
```

---

## 11. Prompt Versions Service (Blind Spot #20)

```typescript
// src/prompts/prompts.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PromptVersion } from './entities/prompt-version.entity';
import { RedisService } from '../common/services/redis.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class PromptsService {
  constructor(
    @InjectRepository(PromptVersion)
    private readonly repo: Repository<PromptVersion>,
    private readonly redis: RedisService,
    private readonly auditService: AuditService,
  ) {}

  async getActivePrompt(name: string): Promise<string> {
    // Check cache first
    const cached = await this.redis.get(`prompt:${name}`);
    if (cached) return cached;
    
    const prompt = await this.repo.findOne({
      where: { name, active: true }
    });
    
    if (!prompt) {
      throw new BadRequestException(`No active prompt found for ${name}`);
    }
    
    // Cache for 5 minutes
    await this.redis.set(`prompt:${name}`, prompt.content, 'EX', 300);
    
    return prompt.content;
  }

  async deploy(name: string, version: string, userId: string): Promise<void> {
    // Get current active for rollback reference
    const currentActive = await this.repo.findOne({
      where: { name, active: true }
    });
    
    // Deactivate current
    await this.repo.update({ name, active: true }, { active: false });
    
    // Activate new version
    const newVersion = await this.repo.findOne({
      where: { name, version }
    });
    
    if (!newVersion) {
      throw new BadRequestException(`Version ${version} not found`);
    }
    
    await this.repo.update(newVersion.id, {
      active: true,
      deployed_at: new Date(),
      deployed_by: userId,
      rollback_from: currentActive?.id
    });
    
    // Invalidate cache
    await this.redis.del(`prompt:${name}`);
    
    await this.auditService.log({
      action: 'prompt_deployed',
      entity_type: 'prompt',
      entity_id: newVersion.id,
      user_id: userId,
      changes: { 
        version,
        previous_version: currentActive?.version
      }
    });
  }

  async rollback(name: string, userId: string): Promise<void> {
    const current = await this.repo.findOne({
      where: { name, active: true },
      relations: ['rollback_from']
    });
    
    if (!current?.rollback_from) {
      throw new BadRequestException('No previous version to rollback to');
    }
    
    await this.deploy(name, current.rollback_from.version, userId);
  }
}
```

---

## 12. Timezone Utilities (Blind Spot #15)

```typescript
// src/common/utils/timezone.ts
import { utcToZonedTime, zonedTimeToUtc, format } from 'date-fns-tz';
import { parseISO } from 'date-fns';

export class TimezoneUtils {
  /**
   * Convert local time to UTC for storage
   */
  static toUtc(localDateString: string, timezone: string): Date {
    const localDate = parseISO(localDateString);
    return zonedTimeToUtc(localDate, timezone);
  }

  /**
   * Convert UTC to local time for display
   */
  static toLocal(utcDate: Date, timezone: string): Date {
    return utcToZonedTime(utcDate, timezone);
  }

  /**
   * Format date for display in tenant's timezone
   */
  static formatLocal(
    utcDate: Date, 
    timezone: string, 
    formatStr: string = 'dd/MM/yyyy HH:mm'
  ): string {
    const localDate = utcToZonedTime(utcDate, timezone);
    return format(localDate, formatStr, { timeZone: timezone });
  }
}

// Usage in AppointmentsService:
// const scheduledAtUTC = TimezoneUtils.toUtc(dto.scheduled_at, tenant.timezone);
```

---

## Checklist de Implementação

| Blind Spot | Arquivo | Status |
|------------|---------|--------|
| #1 | patient-guardians.entity.ts, patient-guardians.service.ts | 📋 |
| #2 | tenant.middleware.ts | ✅ |
| #3 | sanitizer.ts | ✅ |
| #4 | tool-execution.guard.ts | ✅ |
| #6 | idempotency.service.ts | ✅ |
| #7 | appointments.service.ts (two-phase) | 📋 |
| #8 | leads.service.ts | ✅ |
| #9 | takeover-checker.service.ts | ✅ |
| #10 | messages.service.ts | ✅ |
| #11 | media.service.ts | ✅ |
| #13 | queue.service.ts | ✅ |
| #14 | leads.service.ts (canSendFollowup) | ✅ |
| #15 | timezone.ts | ✅ |
| #16 | leads.service.ts (findOrCreate) | ✅ |
| #17 | contact-mutex.service.ts | ✅ |
| #18 | (N8N + System Prompt) | ✅ |
| #19 | queue.service.ts | ✅ |
| #20 | prompts.service.ts | ✅ |

---

**FIM DO ANEXO NESTJS IMPLEMENTATION**
