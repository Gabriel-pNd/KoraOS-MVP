# Brainstorming Session: KoraOS MVP - Infraestrutura de IA para Clínicas de Neurodivergentes

**Data**: 2026-02-07  
**Participantes**: Atlas (Analyst), Gabriel (Founder)  
**Goal**: Ideação e Priorização de Funcionalidades para MVP  
**Contexto**: Neurodivergent clinic technology infrastructure with N8N agents, Web App, and multitenant database

---

## 📋 Contexto da Pesquisa (Síntese)

Com base nos três documentos fornecidos, identificamos:

### Pain Points Validados:
1. **5 Pecados Capitais do Atendimento** (Mystery Shopper)
2. **Modelo Iceberg de Fricção Operacional** (Deep Research)
3. **Gap de Infraestrutura Vertical de IA** (Mercado)

### O Problema Central:
Clínicas de ABA/multidisciplinares operam em **falência operacional invisível**:
- **15% de receita perdida** com glosas médicas evitáveis
- **Turnover de terapeutas** causado por "trabalho fantasma" (entrada manual de dados)
- **Churn familiar** causado por relatórios técnicos ininteligíveis
- **Burnout de secretaria** via "WhatsApp Hell"
- **Atendimento desumanizado** por bots burros e protocolos frios

---

## 🎯 Sessão de Brainstorming

### Round 1: Definindo o Núcleo do MVP (What-Must-Ship)

#### **Pergunta Guia**: Qual é a MENOR combinação de features que:
1. Gera **valor operacional imediato** (reduz dor crítica)?
2. Gera **valor financeiro mensurável** (justifica ROI)?
3. Pode ser **validada em 1 clínica real** em 30-60 dias?

---

## 🧩 Ideias Geradas - Categorização por Domínio

### **Categoria A: Frontend (Web App Multitenant)**

#### Subcategoria A1: Personas Críticas do MVP
**Questão**: Quais são os 3 tipos de usuários MÍNIMOS para um sistema funcional?

**Opções para Discussão**:
1. **Gestor/Admin da Clínica** (Master Tenant)
   - Dashboard de Glosas (Revenue Protection)
   - Gestão de Usuários e Permissões
   - Relatórios Financeiros Básicos
   
2. **Secretária/Recepcionista**
   - Agendamento Inteligente (integrado com IA de WhatsApp)
   - Dashboard de Confirmações e No-Shows
   - Gestão de Guias TISS (autorização antes da sessão)
   
3. **Terapeuta (Mobile-First)**
   - Coleta de Dados Offline (Registro de Sessões)
   - Visualização de Protocolos ABA do Paciente
   - Upload de Evolução Clínica
   
4. **Supervisor Clínico** *(pode ficar para v2?)*
   - Análise de Gráficos de Evolução
   - Aprovação de Programas de Intervenção
   
5. **Portal dos Pais** *(pode ficar para v2 ou é diferencial crítico?)*
   - Relatórios Simplificados (IA Generativa)
   - Visualização do Progresso do Filho

#### Subcategoria A2: Módulos de Interface
**Opções de Priorização**:

| Módulo | Impacto no Pain Point | Complexidade | Prioridade MVP? |
|--------|----------------------|--------------|-----------------|
| **Agendamento Recorrente** | ⭐⭐⭐ (Reduz No-Show) | Média | ✅ SIM |
| **Auditoria Pré-Glosa** | ⭐⭐⭐⭐⭐ (Revenue Protection) | Alta | ✅ SIM |
| **App Mobile Terapeuta** | ⭐⭐⭐⭐⭐ (Anti-Burnout) | Alta | ✅ SIM |
| **Portal dos Pais com IA** | ⭐⭐⭐⭐ (Anti-Churn) | Média | ⚠️ TALVEZ |
| **Dashboard Financeiro** | ⭐⭐⭐ (Visibilidade Lucro) | Média | ⚠️ TALVEZ |
| **Prontuário Eletrônico Completo** | ⭐⭐⭐ (Compliance) | Muito Alta | ❌ V2 |

---

### **Categoria B: Backend (N8N + Agentes de IA)**

#### Subcategoria B1: Agentes Críticos
**Pergunta**: Quais automações N8N entregam valor IMEDIATO?

**Opções**:
1. **Lívia - Agente de Atendimento WhatsApp 24/7**
   - Aplica **SPIN Selling** (anti-Pecado #2: Price Dumping)
   - Triagem Automática (Nome, Idade, Laudo, Disponibilidade)
   - Nunca envia áudio (anti-Pecado #3)
   - Respostas empáticas (anti-Pecado #1: Protocolo Frio)
   - **Valor**: Captura leads fora do horário comercial (anti-Pecado #5)
   
2. **Agente de Confirmação Automática**
   - Envia confirmações via WhatsApp 24h antes
   - Detecta risk de No-Show (histórico do paciente)
   - Sugere reagendamento proativo
   - **Valor**: Reduz No-Show de forma mensurável
   
3. **Agente de Auditoria de Glosas**
   - Valida guias TISS contra regras ANS + Operadora
   - Bloqueia submissão se detectar erro crítico
   - Gera relatório de "Revenue at Risk"
   - **Valor**: ROI direto (5-15% de receita salva)
   
4. **Agente de Relatórios Inteligíveis (IA Generativa)**
   - Traduz dados técnicos ABA (DTT, mandos, tatos) em narrativa
   - Ex: "Maria conquistou pedir água sozinha em 80% das tentativas"
   - **Valor**: Reduz Churn familiar (prova valor)
   
5. **Agente de Síntese de Evolução Clínica** *(v2?)*
   - Analisa registros de terapeutas e gera insights para supervisores
   - **Valor**: Reduz carga do supervisor

#### Subcategoria B2: Integrações de N8N
**Opções para Priorizar**:

| Integração | Impacto | Complexidade | MVP? |
|------------|---------|--------------|------|
| WhatsApp API (Oficial) | ⭐⭐⭐⭐⭐ | Média | ✅ SIM |
| API TISS (Faturamento) | ⭐⭐⭐⭐⭐ | Alta | ✅ SIM |
| Google Calendar (Agenda) | ⭐⭐⭐ | Baixa | ✅ SIM |
| API Planos de Saúde (Elegibilidade) | ⭐⭐⭐⭐ | Muito Alta | ❌ V2 |
| Telegram / Email | ⭐⭐ | Baixa | ❌ V2 |

---

### **Categoria C: Database (Multitenant Architecture)**

#### Subcategoria C1: Modelo de Multitenancy
**Questão CRÍTICA**: Como isolamos dados de clínicas diferentes?

**Opções Arquiteturais**:
1. **Database-per-Tenant** (isolamento total)
   - ✅ Prós: Máxima segurança (LGPD), fácil migração/backup
   - ❌ Contras: Complexidade operacional, custo de infra
   
2. **Schema-per-Tenant** (PostgreSQL schemas)
   - ✅ Prós: Bom isolamento, menor custo que opção 1
   - ❌ Contras: Complexidade de queries, limite de schemas
   
3. **Row-Level Security** (tenant_id em todas as tabelas)
   - ✅ Prós: Simples, escalável, menor custo
   - ❌ Contras: Risco de data leak se houver bug no código
   
**Recomendação para MVP**: Opção 3 (RLS) com Supabase (já tem RLS nativo)

#### Subcategoria C2: Entidades Críticas do MVP
**Opções de Priorização**:

| Entidade | Justificativa | MVP? |
|----------|---------------|------|
| `tenants` (Clínicas) | Core do multitenant | ✅ SIM |
| `users` (Tipos: admin, secretária, terapeuta, pai) | Autenticação | ✅ SIM |
| `patients` (Crianças com TEA) | Core do negócio | ✅ SIM |
| `appointments` (Agendamentos) | Anti-NoShow | ✅ SIM |
| `sessions` (Registro de Sessões) | Anti-Burnout do Terapeuta | ✅ SIM |
| `tiss_guides` (Guias para Faturamento) | Anti-Glosa | ✅ SIM |
| `protocols` (Programas ABA: DTT, NET, etc.) | Complexidade clínica | ⚠️ TALVEZ |
| `data_sheets` (Coleta de Dados Tentativa-a-Tentativa) | Core ABA | ⚠️ TALVEZ |
| `invoices` / `payments` | Financeiro Completo | ❌ V2 |
| `inventory` / `staff_payroll` | ERP Completo | ❌ V2 |

---

## 💡 Divergent Thinking: "Wild Cards" (Ideas Ousadas)

### Wild Card 1: **"Modo Sobrevivência" - MVP para 1 Clínica, não 100**
**Proposta**: Em vez de criar um SaaS multitenant genérico desde o dia 1, validar com **1 single-tenant** (implantação dedicada) e cobrar **R$ 25k setup + R$ 1.5k/mês sustentação** (modelo da pesquisa #3).

**Vantagens**:
- Elimina complexidade de multitenancy no MVP
- Foco 100% em resolver DOR real
- Revenue imediato (não depende de escala)

**Desvantagens**:
- Não escala como SaaS
- Cada novo cliente = novo deploy

### Wild Card 2: **"Portal dos Pais" como Diferencial #1 (Anti-Churn)**
**Proposta**: Colocar o Portal dos Pais (com IA Generativa) como feature KILLER do MVP, porque é o único que nenhum concorrente faz bem.

**Tese**: Glosas e agendamento são "table stakes" (todo ERP faz). O que NINGUÉM faz é traduzir o progresso ABA de forma que mães entendam e se emocionem.

### Wild Card 3: **"Lívia" como Produto Standalone**
**Proposta**: Lançar APENAS o agente de WhatsApp (Lívia) como produto separado antes do ERP completo.

**Modelo de Negócio**: Cobrar R$ 500-1.000/mês por um chatbot que:
- Qualifica leads 24/7
- Agenda automaticamente no Google Calendar da clínica
- Segue SPIN Selling

**Hipótese**: Clínicas pagariam HOJE por isso, mesmo sem o resto do sistema. Valida tração comercial antes de construir tudo.

---

## 🔍 Convergent Thinking: Priorizando "Must-Have" vs "Nice-to-Have"

### Framework de Decisão: **RICE Score**
Para cada feature, calculamos:

**RICE = (Reach × Impact × Confidence) / Effort**

| Feature | Reach (1-10) | Impact (1-10) | Confidence (%) | Effort (1-10) | RICE Score |
|---------|--------------|---------------|----------------|---------------|------------|
| Lívia (WhatsApp Agent) | 10 | 9 | 90% | 6 | **13.5** |
| Auditoria Pré-Glosa | 8 | 10 | 80% | 8 | **8.0** |
| App Mobile Terapeuta | 9 | 10 | 70% | 9 | **7.0** |
| Agendamento Anti-NoShow | 10 | 7 | 90% | 5 | **12.6** |
| Portal dos Pais (IA) | 7 | 9 | 60% | 7 | **5.4** |
| Dashboard Financeiro | 6 | 6 | 80% | 6 | **4.8** |

### Top 3 Features Priorizadas (RICE):
1. **Lívia (WhatsApp Agent)** - 13.5
2. **Agendamento Anti-NoShow** - 12.6
3. **Auditoria Pré-Glosa** - 8.0

---

## 📦 Proposta de MVP (Versão Enxuta Validável)

### **MVP Core - "The Three-Legged Stool"**

#### Leg 1: **Aquisição (Lívia - Agente de WhatsApp)**
- Atende 24/7 seguindo script SPIN Selling
- Captura: Nome, Idade da Criança, Laudo, Disponibilidade
- Agenda diretamente no Google Calendar da clínica
- **Métrica de Sucesso**: Conversão de Lead-to-Appointment > 30%

#### Leg 2: **Retenção (Anti-NoShow + Agendamento Inteligente)**  
- Web App (Secretária): Dashboard de confirmações
- N8N: Envia confirmação automática 24h antes via WhatsApp
- Detecta padrão de falta (histórico) e marca paciente "risk"
- **Métrica de Sucesso**: No-Show < 10% (vs. média de mercado 20-30%)

#### Leg 3: **Revenue Protection (Auditoria de Glosas)**
- Web App (Admin): Visualiza guias TISS "at risk"
- N8N: Valida campos obrigatórios + regras ANS antes de submeter
- Bloqueia envio se detectar erro crítico
- **Métrica de Sucesso**: Redução de Glosas de 15% para < 5%

### **MVP Tech Stack Proposto**

```yaml
Frontend:
  - Next.js (App Router)
  - Shadcn UI (design system)
  - TailwindCSS
  - React Query (state management)
  - Supabase Auth (autenticação multitenant)

Backend/Automation:
  - N8N (self-hosted)
  - Supabase (PostgreSQL + RLS)
  - WhatsApp Business API (oficial)
  - OpenAI API (IA Generativa para Lívia + relatórios)

Database:
  - PostgreSQL (Supabase)
  - Row-Level Security (tenant_id)
  - Multitenancy via RLS policies

Infrastructure:
  - Vercel (Frontend)
  - Railway ou Render (N8N self-hosted)
  - Supabase Cloud (Database + Auth)
```

---

## 🎯 Roadmap de Validação (30-60-90 dias)

### **Fase 1 (Dias 1-30): Proof of Concept - Single Tenant**
**Objetivo**: Validar UMA clínica piloto pagante

**Entregas**:
- [ ] Lívia (WhatsApp) operacional com script SPIN
- [ ] Agendamento manual no admin (sem automação total)
- [ ] Database básico (tenants, users, patients, appointments)
- [ ] 1 clínica piloto onboarded

**Métrica de Sucesso**: Clínica aceita pagar R$ 1.500/mês de sustentação

---

### **Fase 2 (Dias 31-60): MVP Operacional**
**Objetivo**: Sistema roda sozinho (minimal human intervention)

**Entregas**:
- [ ] Confirmação automática de agendamentos via N8N
- [ ] Dashboard da Secretária (visualiza confirmações)
- [ ] Auditoria básica de guias TISS (validação de campos)
- [ ] 2ª clínica piloto onboarded

**Métrica de Sucesso**:
- No-Show da clínica #1 cai de X% para < 10%
- Pelo menos 1 glosa evitada (documentada)

---

### **Fase 3 (Dias 61-90): Validação de Escala**
**Objetivo**: Provar que multitenancy funciona

**Entregas**:
- [ ] App Mobile do Terapeuta (coleta offline básica)
- [ ] 3ª e 4ª clínica onboarded
- [ ] Isolamento de dados validado (auditoria LGPD)
- [ ] Primeiro relatório pais (IA Generativa) gerado

**Métrica de Sucesso**:
- 4 clínicas operando sem conflito de dados
- Churn = 0% (nenhuma clínica cancela)
- NPS > 8/10

---

## ❓ Perguntas Críticas para Próxima Discussão

### **Decisões de Produto**:
1. **MVP deve ser multitenant desde o dia 1** ou validar com single-tenant primeiro?
2. **Portal dos Pais** entra no MVP ou fica para v1.1?
3. **App Mobile do Terapeuta** é essencial ou podemos começar só com web responsive?

### **Decisões de Go-to-Market**:
4. **Modelo de Pricing**: Mensalidade fixa ou por usuário/paciente?
5. **Estratégia de Entrada**: Uma clínica "beta gratuita" ou cobrar desde o dia 1?
6. **Migração de Dados**: Oferecemos "white-glove migration" ou clientes fazem sozinhos?

### **Decisões Técnicas**:
7. **N8N self-hosted** ou N8N Cloud? (custo vs controle)
8. **WhatsApp API oficial** (caro mas confiável) ou não-oficial (barato mas arriscado)?
9. **Database**: Row-Level Security é suficiente ou precisamos schema-per-tenant?

---

## 📊 Categorias de Ideias (Resumo)

### **Quick Wins** (Alto Impacto, Baixo Esforço)
- Confirmação automática de agendamentos
- Script SPIN Selling para Lívia (texto)
- Dashboard básico de No-Shows

### **Big Bets** (Alto Impacto, Alto Esforço)
- App Mobile Offline do Terapeuta
- Auditoria de Glosas contra regras ANS
- Portal dos Pais com IA Generativa

### **Research Needed** (Incerteza Técnica)
- Integração com API de cada operadora de saúde
- Migração automática de dados de Comportatudo/NeoABA
- Detecção de risco de Churn via análise preditiva

### **V2 / Not Now**
- ERP Financeiro completo (folha de pagamento)
- Gestão de estoque (materiais clínicos)
- Módulo de telehealth (sessões online)

---

## 🎓 Key Insights da Sessão

1. **O mercado está quebrado, não só ineficiente**: As clínicas não precisam de "otimização", precisam de RESGATE. Glosas, turnover e churn são sintomas de falência sistêmica.

2. **Dados são REFÉNS, não ativos**: A barreira #1 não é "vender features", é "garantir migração zero-loss". Esse é um problema de confiança, não de tecnologia.

3. **O "trabalho invisível" é onde está o ouro**: Terapeutas trabalham 4 horas extras/semana de graça. Uma feature que salva 1h/dia tem ROI de R$ 800/mês/terapeuta em custo evitado.

4. **Pais não entendem ABA, mas decidem pagar**: O relatório técnico é onde o churn acontece. IA Generativa aqui não é "nice-to-have", é anti-churn insurance.

5. **Lívia (WhatsApp Agent) pode ser produto standalone**: Validar tração comercial vendendo APENAS o chatbot antes de construir todo o ERP reduz risco de produto.

---

**Próximos Passos**:
1. Decidir escopo FINAL do MVP (com base nas 9 perguntas críticas)
2. Criar **Project Brief** formal
3. Handoff para **@pm (Morgan)** para PRD e roadmap técnico detalhado

— Atlas, investigando a verdade 🔎
