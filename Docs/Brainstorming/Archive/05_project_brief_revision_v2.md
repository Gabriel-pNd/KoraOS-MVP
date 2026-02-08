# Project Brief: KoraOS MVP - Revisão v2.0
## Changelog de Atualizações Críticas

**Data da Revisão**: 2026-02-07  
**Versão**: 2.0 (Major Revision)  
**Solicitado por**: Gabriel (Founder)  
**Preparado por**: Atlas (Business Analyst)

---

## 📋 Resumo das Mudanças

Este documento contém todas as atualizações solicitadas em relação ao `04_project_brief_master.md` original.

### Categorias de Mudanças:
1. **Arquitetura** - Adição de Nest.js como backend
2. **Lívia Agent** - Remoção SPIN, adição multimodal, novas regras de escalação
3. **N8N Workflows** - Reestruturação completa (5 workflows core)
4. **UI/UX** - Clarificações de comportamento (Kanban, Agenda, Especialidades)
5. **Entidades** - Atualização do schema de banco de dados
6. **Análise de Blind Spots** - 10 workflow + 5 críticos gerais

---

## 1️⃣ Arquitetura: Adição do Nest.js Backend

### Antes (v1.0):
```
Frontend (Next.js) → Supabase (Database + Auth) ← N8N (Automações)
```

### Depois (v2.0):
```
Frontend (Next.js) → Nest.js (Backend API) → Supabase (Database) ← N8N (Automações)
                            ↑
                      Supabase Auth
```

### Nova Tabela de Technology Decisions:

| Component | Technology | Rationale |
|-----------|------------|-----------|
| **Frontend** | Next.js 14 (App Router) | SSR, API routes, performance |
| **UI Framework** | Shadcn UI + TailwindCSS | Componentes prontos, customizável |
| **Backend API** | **Nest.js** ⭐ NOVO | Camada de negócio centralizada, validação, DTOs, guards |
| **Database** | PostgreSQL (Supabase) | RLS nativo, escalável |
| **Multitenancy** | Row-Level Security (RLS) | Simples, custo-efetivo para MVP |
| **Automation** | N8N (self-hosted) | Controle total, modular, integrações |
| **WhatsApp** | Uazapi (não-oficial) → Oficial (futuro) | Rápido para MVP, migrar depois |
| **AI** | OpenAI API (GPT-4o) | Lívia (multimodal: texto, áudio, imagem) |
| **Auth** | Supabase Auth | Multitenant nativo |
| **Hosting** | Vercel (frontend) + Railway (Nest.js + N8N) | Escalável, managed |

### Diagrama Atualizado:

```
┌─────────────────────────────────────────────────────────────┐
│                      USUÁRIOS FINAIS                         │
│   (Gestor | Secretária | Terapeuta | Leads via WhatsApp)     │
└────────────────────────┬────────────────────────────────────┘
                         │
          ┌──────────────┴──────────────┐
          │                             │
┌─────────▼─────────┐          ┌────────▼────────┐
│    WEB APP        │          │   WHATSAPP      │
│    (Next.js)      │          │   (Uazapi API)  │
│    - Dashboard    │          │   - Lívia (IA)  │
│    - Agenda       │          │   - Lembretes   │
│    - Leads        │          └────────┬────────┘
└─────────┬─────────┘                   │
          │                             │
          │        ┌────────────────────┘
          │        │
          ▼        ▼
┌─────────────────────────┐
│     NEST.JS BACKEND     │  ⭐ NOVO
│     - REST API          │
│     - Business Logic    │
│     - Validações        │
│     - Guards/Auth       │
│     - DTOs              │
└───────────┬─────────────┘
            │
            │   ┌──────────────────────┐
            │   │     N8N AGENTS       │
            ├───┤   (Self-hosted)      │
            │   │   - fluxo_base       │
            │   │   - classificacao    │
            │   │   - gestao_agenda    │
            │   │   - follow_up        │
            │   │   - enviar_lembrete  │
            │   └──────────────────────┘
            │
            ▼
┌─────────────────────────────────────┐
│           SUPABASE                  │
│   - PostgreSQL (RLS)                │
│   - Auth                            │
│   - Storage (Documentos/Áudios)     │
└─────────────────────────────────────┘
```

### Por que Nest.js?

1. **Centralização de Lógica**: Regras de negócio complexas ficam em um lugar só
2. **Validação Robusta**: DTOs com class-validator
3. **Guards de Acesso**: Middleware de autenticação centralizado
4. **Testabilidade**: Unit tests e integration tests facilitados
5. **Padrão Enterprise**: Arquitetura modular e escalável
6. **N8N como Orquestrador**: N8N chama endpoints do Nest.js via HTTP

---

## 2️⃣ Lívia Agent: Especificações Revisadas

### Removido:
- ❌ Aplicação de SPIN Selling

### Adicionado:

#### 2.1 Comportamento Conversacional Inteligente
- **Não ser robótica**: Se o lead já informou informação, **NÃO** perguntar novamente
- **Contexto persistente**: Toda informação coletada é salva e consultada
- **Empática e natural**: Não seguir script rígido

#### 2.2 Triagem Expandida
| Campo | Obrigatório | Descrição |
|-------|------------|-----------|
| Nome do responsável | ✅ Sim | Identificação |
| Nome da criança | ✅ Sim | Core do negócio |
| Idade da criança | ✅ Sim | Alocação de terapeuta |
| Diagnóstico/Laudo | ⚠️ Opcional | Se tiver, pedir envio |
| Disponibilidade | ✅ Sim | Dias/horários preferidos |
| **Convênio/Plano de Saúde** | ⭐ NOVO | Nome do plano |
| **Modalidade de Pagamento** | ⭐ NOVO | Particular, Convênio ou Reembolso |

#### 2.3 Suporte Multimodal
| Tipo | Ação | Implementação |
|------|------|---------------|
| **Áudio** | Transcrever via Whisper | OpenAI Whisper API |
| **Imagem** | Analisar via GPT-4 Vision | Laudos em JPG |
| **Documento PDF** | Extrair texto | OCR/Parser no backend |

> Lívia apenas **responde em texto**. Nunca envia áudios.

#### 2.4 Regras de Escalação
| Trigger | Descrição | Ação |
|---------|-----------|------|
| **Frustração** | Lead expressa irritação | `reason: frustration` |
| **Comportamento Suspeito** | Linguagem ofensiva, spam | `reason: suspicious` |
| **Incompreensão 2x** | Lívia não entende 2x seguidas | `reason: comprehension_failure` |
| **Solicitação Explícita** | "Falar com humano" | `reason: explicit_request` |

#### 2.5 Atualização Automática de Pipeline
| Ação | Mudança de Status |
|------|------------------|
| Lead responde primeira vez | `novo` → `em_qualificacao` |
| Lívia coleta dados completos | → `qualificado` |
| Lead sem resposta (3+ dias) | → `follow_up` |
| Agendamento criado | → `agendado` |
| Confirmação recebida | → `confirmado` |
| Paciente comparece | → `convertido` |
| 2 follow-ups sem resposta | → `perdido` |

---

## 3️⃣ N8N Workflows: 5 Core Workflows

### 3.1 `fluxo_base` (Orquestrador Principal)

**Trigger**: Webhook Uazapi

**Fluxo**:
1. Recebe mensagem
2. Verifica status do número (novo lead, paciente, etc)
3. Se `fromMe=true` + enviado por humano → salvar no histórico, não processar
4. Se `human_takeover=true` → silêncio
5. Chamar `classificacao` (texto, áudio, imagem, documento)
6. Timer 20 segundos (concatenar mensagens "quebradas")
7. Check escalação (frustração, incompreensão 2x, suspeito)
8. AI Agent Node com tools HTTP:
   - `consultar_disponibilidade` → Nest.js
   - `criar_agendamento` → Nest.js
   - `reagendar` → Nest.js
   - `cancelar` → Nest.js
9. Update status do lead (se necessário)
10. Salvar mensagem recebida no histórico
11. Se resposta grande → dividir em blocos lógicos
12. Enviar via Uazapi (delay: ~5 chars/segundo)
13. Salvar mensagem enviada no histórico

### 3.2 `classificacao` (Processador de Mídia)

**Trigger**: HTTP Request do fluxo_base

**Fluxo**:
- `text` → retornar direto
- `audio` → Whisper → transcrição
- `image` → GPT-4 Vision → descrição
- `document` → Parser → texto extraído

### 3.3 `gestao_agenda` (API Bridge)

**Ações**: consultar | agendar | reagendar | cancelar

**Fluxo**:
- Chamar Nest.js endpoints correspondentes
- Aplicar lógica de agendamento sequencial
- Validar conflitos multitenant
- Retornar confirmação formatada para Lívia

### 3.4 `follow_up` (Reativação de Leads)

**Trigger**: Cron 12:00-17:00 (Brasília), a cada 10 min

**Fluxo**:
1. Buscar leads com status `follow_up`, última msg > 3 dias, followup_count < 2
2. Pegar 1 lead por execução
3. Gerar mensagem via OpenAI
4. Enviar via Uazapi
5. Incrementar followup_count
6. Se followup_count = 2 sem resposta → status = `perdido`

### 3.5 `enviar_lembrete` (Confirmação)

**Trigger**: Cron 09:00-12:00 (Brasília), a cada 3 min

**Regra**:
- Terça a Sábado: Lembrete no dia anterior
- Segunda-feira: Lembrete no **Sábado** (não domingo)

**Fluxo**:
1. Calcular data alvo
2. Buscar agendamentos pendentes de confirmação
3. Pegar 1 por execução
4. Enviar mensagem formatada (incluindo número do conselho do terapeuta)
5. Marcar confirmation_sent_at

---

## 4️⃣ 10 Blind Spots nos Workflows

### 1. Webhook de Resposta de Confirmação
- **Problema**: Não há webhook para capturar SIM/NÃO após lembrete
- **Solução**: Detectar no `fluxo_base` ou criar workflow `processar_confirmacao`

### 2. Rate Limit Uazapi
- **Problema**: Muitas mensagens → ban
- **Solução**: Delay mínimo 3-5s, contador por hora, pausar se exceder

### 3. Fallback para Falha de IA
- **Problema**: OpenAI fora do ar = silêncio
- **Solução**: Mensagem padrão + ticket automático `reason: ai_failure`

### 4. Duplicação de Mensagens
- **Problema**: Timer de 20s pode processar mensagens separadamente
- **Solução**: Debounce por sessão, resetar timer a cada nova mensagem

### 5. Gestão de Fuso Horário
- **Problema**: Crons podem falhar dependendo do servidor
- **Solução**: UTC interno, timezone explícito no N8N

### 6. Sincronização de Status (Race Condition)
- **Problema**: Conflito se secretária move lead enquanto Lívia processa
- **Solução**: Locking otimista com `updated_at`

### 7. Leads Duplicados por Número
- **Problema**: Mesmo número pode criar múltiplos leads
- **Solução**: `UNIQUE(tenant_id, phone)`, merge automático

### 8. Expiração de Mídia
- **Problema**: URLs do WhatsApp expiram
- **Solução**: Download imediato → Supabase Storage

### 9. Horários de Feriados
- **Problema**: Lembrete enviado para dia de feriado
- **Solução**: Tabela `holidays`, check antes de enviar

### 10. Auditoria das Ações N8N
- **Problema**: Quem fez ações automatizadas?
- **Solução**: Usuário "livia_bot" no banco, `action_source` no audit_log

---

## 5️⃣ UI/UX Clarificações

### 5.1 Kanban - Drag & Drop Auditado
- **Automático**: Card move quando status muda no Supabase (Realtime)
- **Manual**: Modal de confirmação com senha, registro no audit_log
- **Não-repúdio**: Gestor vê quem moveu manualmente

### 5.2 Agenda - Comportamento de Clique
- **Visão DIA**: Colunas = Terapeutas, Linhas = Horas → Clique abre detalhes
- **Visão SEMANA**: Colunas = Dias, Linhas = Horas → Clique navega para DIA
- **Visão MÊS**: Calendário → Clique navega para DIA

### 5.3 Especialidades com Número do Conselho
- Obrigatório preencher número do conselho ao marcar especialidade
- Lívia pode citar: "Dra. Ana Maria (CRFa 2-12345)"

### 5.4 Remoção de "Trabalhar Mandos"
- Evolução clínica está **FORA DO MVP**

---

## 6️⃣ Entidades Atualizadas

### Novos Campos e Entidades:

| Entidade | Mudança |
|----------|---------|
| `leads` | + payment_method, insurance_name, human_takeover, comprehension_failure_count |
| `conversation_messages` | + message_type, stored_media_path, transcription |
| `support_tickets` | + reason expandido (comprehension_failure, suspicious, ai_failure) |
| `therapists` | specialties agora é JSONB com council_number obrigatório |
| `holidays` (NOVA) | Controle de feriados |
| `message_rate_limits` (NOVA) | Prevenção de ban Uazapi |
| `audit_log` | + action_source, requires_password |

---

## 7️⃣ 5 Pontos Cegos Críticos (Gerais)

### 1. Onboarding de Pacientes Existentes
- **Risco**: Cadastro manual de centenas de pacientes
- **Solução**: Import via CSV

### 2. Múltiplos Números de WhatsApp
- **Risco**: Clínicas com mais de 1 número não atendidas
- **Solução**: Entidade `whatsapp_numbers`, limitar a 1 no MVP

### 3. Horários Irregulares de Terapeutas
- **Risco**: "Segundas ímpares não trabalho" não capturado
- **Solução**: Entidade `therapist_exceptions`

### 4. Privacidade e Consentimento (LGPD)
- **Risco**: Coleta de diagnóstico sem consentimento = multa
- **Solução**: Lívia pede consentimento explícito, registra `consent_given_at`

### 5. Disponibilidade em Horário de Pico
- **Risco**: Muitos leads às 19h = timeout
- **Solução**: Fila (queue), mensagem de alto volume, alerta para admin

---

**Status**: Aguardando aprovação do Founder

— Atlas, investigando a verdade 🔎
