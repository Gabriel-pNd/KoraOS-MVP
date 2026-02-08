# Project Brief: KoraOS MVP - Versão Final v3.0
## Infraestrutura de IA para Clínicas Multidisciplinares

**Data da Versão**: 2026-02-07  
**Versão**: 3.0 (Final Pre-Handoff)  
**Solicitado por**: Gabriel (Founder)  
**Preparado por**: Atlas (Business Analyst)

---

## 📋 Executive Summary

**KoraOS** é uma infraestrutura vertical de IA para clínicas multidisciplinares (TEA, ADHD). O MVP foca em:
1. **Aquisição**: Atendimento WhatsApp 24/7 com IA (Lívia) multimodal e contextual.
2. **Eficiência**: Agendamento sequencial inteligente e redução de no-shows.
3. **Gestão**: Backoffice robusto para secretária e gestor com auditoria total.

**Stack**: Next.js (Frontend) + Nest.js (Backend) + Supabase (DB) + N8N (Automação).

---

## 🏗️ Technical Architecture (v3.0)

### Technology Stack
| Component | Technology | Rationale |
|-----------|------------|-----------|
| **Frontend** | Next.js 14 (App Router) | SSR, Performance, Shadcn UI |
| **Backend API** | **Nest.js** | Regras de negócio, DTOs, Guards, Orquestração |
| **Database** | PostgreSQL (Supabase) | RLS, Scalability, Storage |
| **Automation** | N8N (Self-hosted) | Workflows visuais, Integrações WhatsApp |
| **AI** | OpenAI (GPT-4o + Whisper) | Texto, Áudio, Visão (Laudos/Imagens) |
| **Auth** | Supabase Auth | Multitenancy nativo |

### Fluxo de Dados
```bash
WhatsApp (Uazapi) ↔ N8N ↔ Nest.js API ↔ Supabase (DB)
                          ↑
                       Frontend
```
> **Nota**: Nest.js atua como "cérebro" das regras de negócio. N8N orquestra a comunicação.

---

## 🤖 Lívia Agent: Especificações Finais

### 1. Comportamento & Personalidade
- **Contextual**: JAMAIS perguntar o que já foi informado (ex: nome da criança).
- **Naturalidade**: Não seguir scripts robóticos (SPIN Selling removido). Adaptar ao tom do cliente.
- **Multimodal**:
  - **Texto**: Responde em texto.
  - **Áudio**: Transcreve e entende (Whisper).
  - **Imagem/Doc**: Analisa laudos/carteirinhas (Vision).
  - **Output**: SEMPRE texto (Lívia não envia áudio).

### 2. Triagem Inteligente
Coleta fluida de dados (sem interrogatório):
- **Obrigatórios**: Nome Responsável, Nome Criança, Idade, Disponibilidade.
- **Financeiro**: Convênio (Opcional), Modalidade (Particular/Reembolso/Convênio).
- **Documentos**: Aceita fotos/PDFs de laudos e carteirinhas.

### 3. Escalação Humana (Human Handoff)
Gatilhos para transferir para Secretária:
1. **Frustração/Raiva**: Detectado por análise de sentimento.
2. **Comportamento Suspeito**: Spam, ofensas.
3. **Incompreensão Recorrente**: Se Lívia não entender 2x seguidas.
4. **Solicitação Explícita**: "Quero falar com atendente".

### 4. Pipeline Automation
Atualização automática de status no Kanban:
- `novo` → `em_qualificacao` (primeira resposta)
- `em_qualificacao` → `qualificado` (dados coletados)
- `qualificado` → `follow_up` (24h sem resposta)
- `agendado` → `confirmado` (via lembrete)
- `follow_up` → `perdido` (se pedir para parar ou fechar com outro)

---

## ⚡ N8N Workflows (Lógica Refinada)

### 1. `fluxo_base` (Orquestrador)
- **Trigger**: Webhook Uazapi.
- **Lógica**:
  1. **Validação**: Verifica status do número no Supabase.
  2. **Filtro Humano**: Se `fromMe=true` (humano enviou), apenas salva histórico.
  3. **Human Takeover**: Se ativo, ignora mensagem.
  4. **Delay Inteligente**: Aguarda 20s (debounce) para concatenar mensagens picadas.
  5. **Classificação Multimodal**: Chama workflow `classificacao`.
  6. **AI Decision**: Decide agendar/responder/escalar.
  7. **Tools**: Chama Nest.js para ações de banco (não acessa DB direto).
  8. **Resposta**: Envia via Uazapi (blocos lógicos, delay de digitação min 5s).

### 2. `classificacao` (Media Services)
- **Trigger**: "When Executed by Another Workflow".
- **Função**:
  - Recebe Texto/Áudio/Imagem/PDF.
  - Processa via OpenAI Whisper/Vision ou OCR.
  - Retorna texto limpo estruturado.

### 3. `gestao_agenda` (API Bridge)
- **Trigger**: "When Executed by Another Workflow".
- **Função**: Centraliza chamadas para o Nest.js.
  - Consultar (com logística sequencial).
  - Agendar/Reagendar/Cancelar.
- **Logística**: Tenta otimizar: 1º Mesmo dia sequencial → 2º Mesmo dia espaçado → 3º Dias diferentes.

### 4. `follow_up` (Reativação Complexa)
- **Trigger**: Cron (12h-17h, Seg-Sab, exceto Feriados).
- **Lógica de Tentativas**:
  1. 24h inatividade
  2. 72h
  3. 7 dias
  4. 30 dias
  5. 60 dias
  6. Cada 90 dias (long tail)
- **Ordem**: Do mais antigo para o mais novo.
- **Contexto**: Gera mensagem baseada na *última conversa* (não genérica).
- **Rate Limit**: Intervalo randômico para não parecer bot (ex: 6 msgs/hora distribuídas aleatoriamente).

### 5. `enviar_lembrete` (Confirmação)
- **Trigger**: Cron (9h-12h).
- **Regra**: Envia 1 dia antes (Segunda envia no Sábado).
- **Check**: Verifica tabela `holidays` antes de enviar.

---

## 🔍 Soluções para Pontos Cegos (Explicadas)

### 1. Fallback de IA (`ai_failure`)
- **Problema**: OpenAI cai ou retorna erro 500.
- **Solução**: Nó de "Error Trigger" no N8N captura a falha. Envia mensagem fixa: *"Estou com uma instabilidade técnica momentânea. Já avisei nossa equipe!"* e cria ticket urgente. Cliente não fica no vácuo.

### 2. Locking Otimista (`updated_at`)
- **Problema**: Secretária edita lead no painel `14:00:00`. Lívia tenta editar `14:00:01` com dados velhos.
- **Solução**: Nest.js verifica: *"O registro mudou desde que você o leu?"*. Se sim, rejeita e pede para reler. Garante integridade dos dados.

### 3. Tabela Holidays
- **Problema**: Robô agenda lembrete para feriado.
- **Solução**: Tabela `holidays` cadastrada pelo gestor. Cron verifica: `IF tomorrow IN holidays THEN skip`.

### 4. Unique Constraint (`tenant_id, phone`)
- **Dúvida**: Permite irmãos?
- **Definição**:
  - `leads`: Mantemos **UNIQUE**. 1 Telefone = 1 Oportunidade ativa de negociação. Se a mãe tem 2 filhos, ela negocia ambos no mesmo contexto de "Lead".
  - `patients`: **SEM UNIQUE** no telefone. Mãe pode ter 3 filhos cadastrados com o mesmo número dela.
  - `users` (App): Secretária acessa visualizando o "Contato" (Mãe) e seus "Dependentes" (Filhos).

### 5. Storage para Mídia
- **Solução**: Mídia do WhatsApp expira em horas. O N8N baixa o binário IMEDIATAMENTE e faz upload pro Supabase Storage. O banco salva apenas o path (`/leads/123/laudo.pdf`). Seguro e perene.

---

## 💻 UX/UI Decisions

### Kanban (Comercial)
- **Status Automático**: Lívia move os cards.
- **Intervenção Manual**: Secretária pode arrastar, mas exige **Senha** + **Justificativa** (Auditoria de Não-Repúdio).
- **Visual**: Badges de tempo ("3d sem resposta"), ícones de canal (Zap/Insta).

### Agenda Inteligente
- **Visão Semana/Mês**: Apenas "mapa de calor". Clique leva para **Visão Dia**.
- **Visão Dia**:
  - Colunas = Terapeutas.
  - Linhas = Horários.
  - **Agendamento**: Modal mostra dados do paciente + Terapeuta com **Número do Conselho** (Obrigatório).

### Gestão de Terapeutas
- **Exceções de Horário**: Nova aba no perfil do terapeuta.
- **UI**: Calendário anual onde clica nos dias para marcar "Folga/Ausente".
- **Acesso**: Gestor pode delegar essa visão para a Secretária.

---

## 💾 Schema de Banco de Dados (v3.0 - Resumo)

### `leads` (Refinado)
- `status`: novo, em_qualificacao, qualificado, follow_up, agendado, confirmado, convertido, perdido.
- `payment_preference`: particular, convenio, reembolso.
- `last_interaction_at`: timestamp para timer de 24h.
- `followup_stage`: 1 (24h), 2 (72h), 3 (7d)...

### `therapist_exceptions` (Novo)
- `therapist_id`: FK
- `date`: YYYY-MM-DD
- `type`: 'off_day', 'partial_off'
- `reason`: 'ferias', 'medico'

### `holidays` (Novo)
- `tenant_id`: FK (ou null para nacional)
- `date`: YYYY-MM-DD
- `name`: 'Natal'

### `system_users` (Seed)
- ID fixo para **"IA"** (antigo livia_bot) para assinar logs de auditoria automatizados.

---

## 🚨 Blind Spots Finais (Aprovados para Implementação)

1. **Importação CSV**: Onboarding de pacientes legados (Nome + Phone).
2. **Rate Limit Random**: Intervalos aleatórios para evitar ban Uazapi.
3. **Fila de Mensagens**: Queue para picos de acesso (19h).
4. **LGPD Consent**: Lívia pede "Aceito" antes de pegar dados sensíveis.
5. **Múltiplos Filhos**: Estrutura de `Contact` (Pai/Mãe) -> N `Patients` (Filhos).

---

**Status**: ✅ Aprovado para Desenvolvimento  
**Próximo Passo**: Handoff para @pm (Product Manager) iniciar PRD.

— Atlas, investigando a verdade 🔎
