# KoraOS MVP - Project Brief v3.1 Executive
**Documento Master para Handoff ao PM**

**Versão**: 3.1 Final  
**Data**: 2026-02-08  
**Status**: ✅ APPROVED FOR PM HANDOFF  
**Autor**: Atlas (Business Analyst)

---

## 📚 ÍNDICE DE DOCUMENTAÇÃO

Este documento é o **Executive Brief**. Para detalhes técnicos completos, consulte os anexos:

| Anexo | Arquivo | Conteúdo |
|-------|---------|----------|
| A | [08a_database_schema_complete.sql](./08a_database_schema_complete.sql) | 14 entidades SQL, índices, RLS, triggers |
| B | [08b_n8n_workflows_complete.md](./08b_n8n_workflows_complete.md) | 5 workflows N8N step-by-step |
| C | [08c_livia_agent_blindspots.md](./08c_livia_agent_blindspots.md) | Spec da Lívia + 12 Blind Spots |

---

## 1. VISÃO EXECUTIVA

### O Que É o KoraOS?

Plataforma de infraestrutura AI para **clínicas multidisciplinares de neurodesenvolvimento** (TEA, ADHD, atraso de desenvolvimento) que automatiza:

1. **Aquisição de Leads** → IA conversacional 24/7 via WhatsApp (Lívia)
2. **Agendamento Inteligente** → Match-making terapeuta + otimização logística
3. **Gestão de Pipeline** → Kanban automatizado com follow-ups escalonados

### Proposta de Valor

| Para | Dor Atual | Solução KoraOS |
|------|----------|---------------|
| **Gestor** | Lead perdido, sem auditoria | Pipeline visual + logs completos |
| **Secretária** | Telefones tocando sem parar | IA atende 24/7, só escala emergências |
| **Família** | Atendimento robótico, demora | Conversas naturais, resposta imediata |

### Modelo de Negócio

- **Beta**: Gratuito (3 clínicas piloto)
- **Pricing**: Baseado em ROI (+ receita, - despesa → plano personalizado)
- **Potencial**: ~6.000 clínicas no Brasil, TAM de R$180M/ano

---

## 2. STACK TECNOLÓGICO

```
┌─────────────────────────────────────────────────┐
│                  FRONTEND                        │
│     Next.js 14 + Shadcn UI + TailwindCSS        │
│              [Vercel Hosting]                    │
└─────────────────────┬───────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│                  BACKEND                         │
│          Nest.js (Orquestrador Central)         │
│        [Railway / Render Hosting]                │
└─────────────────────┬───────────────────────────┘
                      │
          ┌───────────┴───────────┐
          ▼                       ▼
┌──────────────────┐    ┌──────────────────┐
│      N8N         │    │    SUPABASE      │
│  (5 Workflows)   │    │  - PostgreSQL    │
│  [Self-hosted]   │    │  - Storage       │
│                  │    │  - Auth (RLS)    │
└──────────────────┘    └──────────────────┘
          │
          ▼
┌──────────────────┐
│  INTEGRAÇÕES     │
│  - OpenAI GPT-4o │
│  - Whisper       │
│  - Uazapi (WA)   │
└──────────────────┘
```

**Decisões-Chave**:
- Nest.js como "cérebro" → N8N não acessa banco direto
- Queue de mensagens → Zero perda durante downtime
- Contact-centric → 1 telefone = 1 contact = N pacientes

---

## 3. DATABASE SCHEMA (RESUMO)

**14 Entidades** (detalhes no Anexo A):

| Entidade | Propósito | Relacionamentos |
|----------|-----------|-----------------|
| `tenants` | Clínicas (multitenancy root) | 1:N users, contacts |
| `users` | Autenticação + perfis | N:1 tenant |
| `contacts` | Centro de dados (telefone) | 1:N patients, leads |
| `patients` | Pacientes convertidos | N:1 contact |
| `leads` | Pipeline comercial | N:1 contact |
| `conversations` | Chats por plataforma | N:1 contact |
| `conversation_messages` | Histórico de mensagens | N:1 conversation |
| `therapists` | Terapeutas + especialidades | 1:1 user |
| `therapist_exceptions` | Folgas, férias, congressos | N:1 therapist |
| `appointments` | Agendamentos | N:1 patient, therapist |
| `holidays` | Feriados (nac/est/mun) | N:1 tenant (ou null) |
| `clinic_hours` | Horário funcionamento | 1:1 tenant + dia |
| `support_tickets` | Tickets de escalação | N:1 contact/lead |
| `message_queue` | Fila anti-perda | N:1 tenant |
| `audit_log` | Não-repúdio total | N:1 user |

**RLS**: Todas as tabelas com tenant_id usam Row-Level Security.

---

## 4. LÍVIA: IA AGENT (RESUMO)

**Capacidades**:
- Multimodal: texto, áudio (Whisper), imagens (Vision), PDFs
- Memória contextual: nunca pergunta dado já coletado
- Tools: consultar, agendar (com confirmação), reagendar, cancelar, escalar

**Regras Críticas**:
1. SEMPRE confirmar explicitamente antes de criar agendamento ("CONFIRMAR")
2. Para irmãos, SEMPRE perguntar preferência: mesmo horário ou sequencial?
3. Escalar para humano em: frustração, incompreensão 2x, pedido explícito

**Pipeline Automatizado**:
```
[Novo] → [Em Qualificação] → [Qualificado] → [Agendado] → [Confirmado] → [Sucesso] → [Convertido]
                                    ↓               ↓
                              [Follow-up]      [No-Show]
                                    ↓
                              [Perdido/Unreachable]
```

(Detalhes completos no Anexo C)

---

## 5. N8N WORKFLOWS (RESUMO)

**5 Workflows Core** (detalhes no Anexo B):

| # | Nome | Trigger | Função |
|---|------|---------|--------|
| 1 | `fluxo_base` | Webhook WhatsApp | Orquestrador principal |
| 2 | `classificacao` | Execute Workflow | Processa áudio/imagem/PDF |
| 3 | `gestao_agenda` | Execute Workflow | Bridge para agendamentos |
| 4 | `follow_up` | Cron (12h-17h, Seg-Sáb) | Reativação escalonada |
| 5 | `enviar_lembrete` | Cron (9h-12h) | Confirmação D-1 |

**Lógica de Follow-up**:
- Stage 1: 24h → Stage 2: 72h → Stage 3: 7d → Stage 4: 30d → Stage 5: 60d → Stage 6+: cada 90d
- Oldest first (FIFO)
- Contextual (referencia última conversa)
- Skip domingos e feriados

---

## 6. BLIND SPOTS RESOLVIDOS (12)

| # | Problema | Solução |
|---|----------|---------|
| 1 | Rate limit Uazapi | Intervalos randômicos, max 6/hora |
| 2 | AI Failure | Clinic hours check → fallback ou ticket |
| 3 | Race condition | Locking otimista (X-Expected-Version) |
| 4 | Perda de mensagens | Queue persistente Nest.js |
| 5 | Conflito irmãos | Validar contact_id não duplica horário |
| 6 | Agendamento sem confirmação | Campo `confirmed_by_contact: true` obrigatório |
| 7 | Deleção acidental | Soft delete + Lixeira 30 dias |
| 8 | Número bloqueado | Detectar erro → status `unreachable` |
| 9 | Feriados locais | BrasilAPI + UI custom |
| 10 | Terapeuta sai | Wizard de transferência 3 passos |
| 11 | Auditoria Kanban | Senha + motivo + audit_log |
| 12 | Storage limits | Cron diário → alerta Super Admin |

(Implementação técnica no Anexo C)

---

## 7. TELAS MVP (12)

### 7.1 Personas e Acessos

| Persona | Telas | Permissões |
|---------|-------|------------|
| **Secretária** | Login, Pipeline, Agenda, Conversas, Pacientes | CRUD leads/appointments, visualizar tudo |
| **Gestor** | Todas acima + Dashboard, Terapeutas, Configurações | + CRUD terapeutas, ver audit |
| **Super Admin** | Todas acima + Tenants, Usuários globais | Acesso total a todos tenants |

### 7.2 Lista de Telas

1. **Login** - Supabase Auth, recuperação de senha
2. **Dashboard** (Gestor) - KPIs, gráficos, alertas
3. **Pipeline (Kanban)** - Drag-drop com confirmação de senha
4. **Agenda** - Dia/Semana/Mês, modal de detalhes, council number
5. **Conversas** - Chat real-time, histórico, takeover manual
6. **Pacientes** - CRUD, vínculo com contact, histórico
7. **Leads** - Detalhes, timeline, ações
8. **Terapeutas** - Especialidades, disponibilidade, exceções
9. **Configurações** - Horários, feriados, integrações
10. **Lixeira** - Soft-deleted items, restauração
11. **Tenants** (SuperAdmin) - Multi-clínica
12. **Usuários** (SuperAdmin) - Gestão global

---

## 8. ROADMAP MVP (12 SEMANAS)

| Fase | Semanas | Entregas |
|------|---------|----------|
| 1 - Foundations | 1-2 | Auth + RLS + entidades base |
| 2 - Pipeline | 3-4 | Kanban + CRUD leads |
| 3 - Lívia Core | 5-6 | N8N fluxo_base + classificacao |
| 4 - Scheduling | 7-8 | Agenda + gestao_agenda |
| 5 - Engagement | 9-10 | follow_up + enviar_lembrete |
| 6 - Polish | 11 | Terapeutas + exceções + feriados |
| 7 - Beta | 12 | Deploy + 3 clínicas piloto |

---

## 9. PRÓXIMOS PASSOS

1. **PM (Morgan)**: Criar PRD detalhado com User Stories baseado neste brief
2. **Architect (Kane)**: Validar diagramas C4 e decisões de infra
3. **Dev Team**: Iniciar Fase 1 após PRD aprovado
4. **QA (Jules)**: Preparar test plans para cada fase

---

## 10. APROVAÇÕES

| Stakeholder | Status | Data |
|-------------|--------|------|
| Product Owner (Gabriel) | ✅ Aprovado | 2026-02-08 |
| Business Analyst (Atlas) | ✅ Documentado | 2026-02-08 |
| PM (Morgan) | ⏳ Pendente PRD | - |
| Tech Lead | ⏳ Pendente | - |

---

**Documento preparado por Atlas, investigando a verdade 🔎**

**Anexos**:
- [A: Database Schema SQL](./08a_database_schema_complete.sql)
- [B: N8N Workflows](./08b_n8n_workflows_complete.md)
- [C: Lívia Agent + Blind Spots](./08c_livia_agent_blindspots.md)
