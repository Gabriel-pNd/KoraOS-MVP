# Meta Prompt para Claude.ai (Deep Analysis KoraOS)

## 📌 Documentos Complementares para Anexar
Para que o Claude faça a análise profunda, anexe os seguintes arquivos da pasta `Docs/Brainstorming`:

1. **Visão Executiva**: `08_project_brief_v3.1_MASTER.md`
2. **Dados e Regras**: `08a_database_schema_complete.sql`
3. **Fluxos de Automação**: `08b_n8n_workflows_complete.md`
4. **Agente e Soluções**: `08c_livia_agent_blindspots.md`
5. **Contexto Anterior**: `07_blind_spots_analysis_v2.md`

Esses 5 arquivos contêm a "verdade" atual do projeto.

---

## 🤖 COPIE O PROMPT ABAIXO E COLE NO CLAUDE.AI

```markdown
# Role & Context
You are a Senior Solutions Architect and Quality Assurance Specialist with deep expertise in Healthcare AI, HIPAA/LGPD Compliance, and Event-Driven Architectures (N8N + Nest.js + Supabase).

# Project Overview: KoraOS MVP
We are building an AI infrastructure for multidisciplinary neurodevelopmental clinics (Autism/ADHD/Developmental Delays). The core value proposition is automating patient acquisition (WhatsApp) and scheduling logistics while maintaining human oversight.

# Core Architecture
- **Frontend**: Next.js 14 (App Router)
- **Backend**: Nest.js acting as central orchestrator (API Gateway + Business Logic)
- **Database**: Supabase PostgreSQL (RLS enabled for multitenancy)
- **Automation**: N8N self-hosted for 5 core workflows (Triage, Classification, Scheduling Bridge, Follow-up, Reminders)
- **AI Agent (Lívia)**: OpenAI GPT-4o with multimodal capabilities (Text/Audio/Image/PDF), strictly controlled via system prompts and function calling.
- **Channel**: Unofficial WhatsApp API (Uazapi).

# Key Decisions Already Made (Do NOT challenge these unless critical failure identified)
1. **Contact-Centric Model**: 1 Phone Number = 1 Contact = N Patients/Leads (handling siblings).
2. **Queue-First**: All webhooks go to Nest.js -> Redis/PG Queue -> N8N (anti-loss).
3. **Locking**: Optimistic locking via `updated_at` versioning.
4. **Scheduling Logic**: Mother with 2 kids -> Suggest sequential or parallel slots based on preference.
5. **Audit**: Non-repudiation logs for all actions (especially manual ones).

# The Goal
I have attached the Project Brief v3.1 and Technical Annexes (Schema, Workflows, Agent Specs). We have already identified and solved 12 "blind spots" (e.g., rate limits, AI hallucinations, holidays, storage limits).

**YOUR TASK is to perform a "Deep Code Review & Threat Modeling" to find 10 NEW, subtle, or critical blind spots that we missed.**

Focus on:
1. **Edge Cases in Logic**: Sequence of events that breaks the state machine (e.g., what if a user sends a new message milliseconds before the AI sends a tool call?).
2. **Data Integrity**: Inconsistencies between `leads`, `patients`, and `contacts` during complex transitions (e.g., converting a lead to a patient while a follow-up workflow is pending).
3. **Operational Bottlenecks**: Scenarios where the human (secretary) becomes the bottleneck or ignores the system, causing a deadlock.
4. **Security & Privacy (LGPD)**: Leaks of sensitive data in logs, unauthorized access via shared phones (divorced parents sharing a child's care).
5. **Financial Risks**: Loopholes in the simple "ROI-based" pricing or inability to track attribution correctly.

# Output Format
Please provide a report with exactly **10 NEW Critical Blind Spots**. Format each as:

### [Blind Spot #N] Title
**Scenario**: Description of the specific sequence of events or condition that triggers the failure.
**Impact**: Why is this bad? (Data loss, financial loss, legal risk, UX failure).
**Proposed Solution**: A concrete technical or process fix (e.g., "Add a `cleanup_cron`", "Implement a mutex on `contact_id`", "Change DB constraint").

# Constraints
- Do NOT suggest features outside the MVP scope (e.g., "Build a mobile app").
- Do NOT repeat the 12 blind spots already solved in the attached documents (Rate Limited, Holidays, etc.).
- Be ruthless. We want to find bugs NOW, not in production.
```
