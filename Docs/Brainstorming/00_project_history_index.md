# Backup da Sessão: Definição do MVP KoraOS

**Data**: 2026-02-07  
**Projeto**: KoraOS MVP (Infraestrutura de IA para Clínicas Multidisciplinares)  
**Participantes**: Atlas (Analyst), Gabriel (Founder)

---

## 1. Início do Projeto
**Solicitação**: Iniciar novo projeto do zero.  
**Contexto**: Três documentos de pesquisa fornecidos (`Cliente-Oculto`, `Dores-Clínicas`, `Infra-IA`).

### Insights Iniciais (Mystery Shopper & Dores):
- Clínicas operam em "falência operacional invisível".
- 5 Pecados do Atendimento: Protocolos frios, Bots inúteis, Áudios excessivos, Price Dumping, Falta de 24/7.
- Dores Críticas: Glosas (15% receita perdida), Turnover terapeutas ("trabalho fantasma"), Churn familiar (relatórios ruins).

---

## 2. Sessão de Brainstorming (Ideação)
**Objetivo**: Definir MVP "Three-Legged Stool".

### Propostas Iniciais:
1. **Lívia (WhatsApp Agent)**: Atendimento 24/7 com SPIN Selling. (RICE: 13.5)
2. **Agendamento Anti-NoShow**: Confirmação automática. (RICE: 12.6)
3. **Auditoria de Glosas**: Validação TISS. (RICE: 8.0)

**Decisões Críticas (Feedback do Gabriel)**:
- ✅ **Multitenancy**: RLS desde o dia 1.
- ✅ **Web App**: Foco em web responsive (sem mobile nativo no MVP).
- ❌ **Auditoria de Glosas**: REMOVIDA do MVP.
- ❌ **Portal dos Pais**: REMOVIDO do MVP (v1.1+).
- ✅ **Precificação**: Baseada em ROI.
- ✅ **Onboarding**: White-glove (manual).

---

## 3. Deep Dive & Refinamentos (Arquitetura)
**Solicitação**: Refinar escopo do MVP, focar em logística de agendamento e web app.

### Novas Definições:
- **Agente de Agendamento (Simplificado)**: Foco em logística sequencial (múltiplos terapeutas no mesmo dia) para reduzir idas à clínica.
- **N8N Modularization**: Arquitetura modular (5 fluxos separados) para evitar "megazords".
- **Novos Agentes**:
  - **Follow-up**: Reengaja leads frios após 3 dias.
  - **Escalação Humana**: IA detecta frustração -> Ticketing para recepcionista.
- **Auditoria e Não-Repúdio**:
  - Soft Delete (nunca apagar fisicamente).
  - Tabela universal de `audit_log`.
  - Histórico imutável visível para SuperAdmin.

---

## 4. Arquitetura de Telas (UX/UI)
**Solicitação**: Detalhar telas para Recepção, Gestor e SuperAdmin.

### Telas Definidas:

**Persona: Recepção**
1. **Home**: "O que fazer agora?" (Alertas + Tarefas).
2. **Comercial (Kanban)**: Pipeline de leads (Qualificação -> Follow Up -> Agendado -> Confirmado -> Sucesso).
3. **Agenda (3 Visões)**: Dia (detalhada), Semana (resumida), Mês (simplificada).
4. **Contatos**: Lista unificada de Leads e Pacientes.

**Persona: Gestor**
5. **Dashboard Executivo**: Funil de leads, Performance terapeutas, Alertas estratégicos.
6. **Gestão de Usuários**: Criar/editar secretárias e terapeutas.
7. **Gestão de Terapeutas**: Editor de disponibilidade semanal.
8. **Configurações**: Dados da clínica, horários, integrações.

**Persona: SuperAdmin (Gabriel)**
9. **Dashboard Global**: Métricas de todas as clínicas.
10. **Gestão de Tenants**: Criar/Pausar clínicas.
11. **Auditoria Global**: Logs de todas as alterações.
12. **Monitoramento Infra**: Status N8N, Supabase, Uazapi.

---

## 5. Consolidado Final (Project Brief)
**Resultado**: Criação do `project_brief.md` (1.500+ linhas) para handoff.

### Escopo Final MVP (Resumo):
- **Stack**: Next.js, Supabase (RLS), N8N (Self-hosted), WhatsApp (Uazapi).
- **Core Features**: Lívia (IA), Agendamento Inteligente, Follow-up, Escalação, Auditoria.
- **Roadmap**: 12 semanas (Foundation -> Lívia -> Agendamento -> Gestão -> Pilot).
- **Business Model**: Cobrança por valor (ROI de 20%).

---

## 📂 Estrutura de Arquivos

### 📍 Raiz / Oficial (v3.2)
1.  [11 - Blind Spots v3 Consolidado](11_blind_spots_v3_consolidated.md)
2.  [08 - Project Brief v3.1 MASTER](08_project_brief_v3.1_MASTER.md)
3.  [08a - Database Schema SQL v3.2](08a_database_schema_complete.sql)
4.  [08b - N8N Workflows v3.2](08b_n8n_workflows_complete.md)
5.  [08c - Lívia Agent + Blind Spots](08c_livia_agent_blindspots.md)
6.  [08d - NestJS Implementation](08d_nestjs_implementation.md)

### 🏛️ Archive / Histórico (Depreciado)
*Arquivos movidos para pasta `Archive/`*

7.  [Project Brief v3.0](Archive/06_project_brief_v3.md)
8.  [Blind Spots Analysis v2.0](Archive/07_blind_spots_analysis_v2.md)
9.  [Project Brief v2.0](Archive/05_project_brief_revision_v2.md)
10. [Deep Dive Técnico](Archive/02_mvp_technical_deep_dive.md)
11. [UI/UX Specifications](Archive/03_ui_ux_specifications.md)
12. [Brainstorming Session](Archive/01_brainstorming_session.md)
13. [Project Brief v1.0](Archive/04_project_brief_master.md)

### Outros
14. [Task Checklist](99_task_tracking.md)
15. [Prompts de Análise](09_claude_deep_analysis_prompt.md)

---

**Status Atual**: ✅ v3.2 COMPLETO - Documentação Organizada
