# KoraOS - Telas Adicionais Detalhadas

**Data**: 2026-02-07  
**Complemento ao**: mvp_deep_dive.md

---

## 📱 Telas da RECEPÇÃO (Conforme Solicitado)

### ✅ **Tela 1: Home Inicial** ("O que devo fazer agora?")
✅ Já detalhada no mvp_deep_dive.md

---

### ✅ **Tela 2: Comercial - Pipeline de Vendas (Kanban)**

**Objetivo**: Visualização simplificada do funil de leads atendidos pela Lívia.

**Colunas do Kanban**:

| **Em Qualificação** | **Follow Up** | **Agendado** | **Confirmado** | **Sucesso!** |
|---------------------|---------------|--------------|----------------|--------------|
| Lead novo, L ívia ainda coletando dados | Lead respondeu mas não agendou (await follow-up) | Primeira consulta agendada | Paciente confirmou presença | Virou paciente ativo |

**Wireframe**:
```
┌─────────────────────────────────────────────────────────────────────────┐
│ 💼 Pipeline Comercial                                     [Mês ▼] [Filtros] │
├─────────┬──────────────┬───────────┬────────────┬────────────────────────┤
│   Em    │  Follow Up   │ Agendado  │ Confirmado │      Sucesso! 🎉       │
│Qualif.  │              │           │            │                        │
├─────────┼──────────────┼───────────┼────────────┼────────────────────────┤
│ 📝 Maria│  🔔 Ana S.   │ ✅ Pedro  │ ✅ Lucas   │ 🎊 João (Convertido)   │
│ Silva   │  (3 dias)    │ Costa     │ Almeida    │    05/02               │
│ TEA N2  │  TEA N1      │ TEA N2    │ TEAH       │                        │
│ ↓       │  ↓           │ ↓         │ ↓          │ 🎊 Júlia (Convertida)  │
│         │  🔔 Roberto  │           │            │    03/02               │
│ 📝 Carla│  (5 dias)    │           │            │                        │
│ Santos  │  TEA N3      │           │            │                        │
└─────────┴──────────────┴───────────┴────────────┴────────────────────────┘
```

**Funcionalidades**:
- **Arrastar e soltar** (drag & drop) para mudar status manualmente
- **Badge de tempo**: Mostra há quantos dias o lead está na coluna (ex: "há 3 dias")
- **Filtros**: Por origem (WhatsApp, Site), por diagnóstico
- **Click no card**: Abre detalhes do lead (Tela 2.2 do mvp_deep_dive)

**Dados Exibidos no Card**:
- Nome do responsável
- Nome da criança + idade
- Diagnóstico/Laudo
- Última interação (timestamp)

---

### ✅ **Tela 3: Agenda** (Conforme Solicitado)

**Objetivo**: 3 visões diferentes da agenda (Dia, Semana, Mês)

#### **3.1 Visão do DIA (Hiper Detalhada)**

**Informações exibidas**:
- Hora × Terapeuta (matrix)
- Nome completo do paciente
- Tipo de terapia
- Status de confirmação
- Observações especiais

**Wireframe**:
```
┌────────────────────────────────────────────────────────────────────┐
│ 📅 Agenda - Hoje (07/02/2026)                        [Dia▼Semana▼Mês]│
├──────┬─────────────────────────┬──────────────────────────────────┤
│ Hora │ Dr. João (ABA)          │ Dra. Ana (Fono)                  │
├──────┼─────────────────────────┼──────────────────────────────────┤
│ 08:00│ 👦 Pedro Costa (4 anos) │ LIVRE 🟢                         │
│      │ ✅ Confirmado           │                                  │
│      │ 📝 "Trabalhar mandos"   │                                  │
├──────┼─────────────────────────┼──────────────────────────────────┤
│ 10:00│ 👧 Maria Silva (5 anos) │ 👦 Lucas (3 anos)                │
│      │ ⏳ Pendente confirmação │ ✅ Confirmado                    │
│      │                         │ ⚠️ "Criança gripada"             │
├──────┼─────────────────────────┼──────────────────────────────────┤
│ 14:00│ LIVRE 🟢                │ 👧 Júlia (6 anos)                │
│      │                         │ ✅ Confirmada                    │
└──────┴─────────────────────────┴──────────────────────────────────┘
```

---

#### **3.2 Visão da SEMANA (Resumida)**

**Informações exibidas**:
- Paciente (apenas nome)
- Status (cores)
- Horário

**Wireframe**:
```
┌──────────────────────────────────────────────────────────────┐
│ 📅 Semana de 10/02 - 16/02                                   │
├───────┬────────┬────────┬────────┬────────┬────────┬─────────┤
│       │ SEG    │ TER    │ QUA    │ QUI    │ SEX    │ SÁB     │
├───────┼────────┼────────┼────────┼────────┼────────┼─────────┤
│ 08:00 │Pedro✅ │Ana⏳   │        │Lucas✅ │Maria✅ │         │
│ 10:00 │        │João✅  │Pedro✅ │        │Ana✅   │Roberto⏳│
│ 14:00 │Carla✅ │        │Lucas✅ │Júlia✅ │        │         │
└───────┴────────┴────────┴────────┴────────┴────────┴─────────┘
```

**Legenda de cores**:
- 🟢 Verde: Confirmado
- 🟡 Amarelo: Pendente
- 🔴 Vermelho: Cancelado/No-show

---

#### **3.3 Visão do MÊS (Hiper Simplificada)**

**Informações exibidas**:
- Apenas números: Quantidade de agendamentos por dia
- Cores de intensidade: Poucos agendamentos (claro), Muitos agendamentos (escuro)

**Wireframe**:
```
┌──────────────────────────────────────────────────┐
│ 📅 Fevereiro 2026                                │
├───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬
│D  │S  │T  │Q  │Q  │S  │S  │... (calendário)     │
├───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼
│   │   │   │   │   │   │ 1 │ 2 │ 3 │ 4 │ 5 │ 6 │
│   │   │   │   │   │   │ 8 │12 │15 │10 │14 │   │
│   │   │   │   │   │   │🟢 │🟡 │🟢 │🟢 │🟢 │   │
└───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴

Legenda:
• Número = Total de agendamentos
• Cor: 🟢 Normal | 🟡 Alta demanda | 🔴 Sobrecarga
```

---

### ✅ **Tela 4: Contatos** (Leads + Pacientes)

**Objetivo**: Lista unificada de todos os contatos (leads que ainda não converteram + pacientes ativos).

**Tabs**:
1. **Todos** (leads + pacientes)
2. **Leads** (apenas prospects)
3. **Pacientes** (apenas convertidos)

**Wireframe**:
```
┌─────────────────────────────────────────────────────────────────────┐
│ 📇 Contatos                          [Todos▼] [Busca: _____] [Filtros]│
├─────────────────────────────────────────────────────────────────────┤
│ Tipo    │ Nome Responsável│ Criança   │ Telefone    │ Status        │
├─────────┼────────────────┼──────────┼────────────┼──────────────┤
│ 🔵 Lead │ Maria Silva    │ João (4) │ 48 99999   │ Em conversa  │
│ 🟢 Pac. │ Ana Costa      │ Pedro(5) │ 48 98888   │ Ativo        │
│ 🔵 Lead │ Roberto Alves  │ Lucas(3) │ 48 97777   │ Follow up    │
│ 🟢 Pac. │ Carla Santos   │Júlia (6) │ 48 96666   │ Ativo        │
└─────────┴────────────────┴──────────┴────────────┴──────────────┘
```

**Filtros disponíveis**:
- Por status (Lead vs Paciente)
- Por diagnóstico
- Por data de criação
- Por última interação

**Ações por linha**:
- [Ver Detalhes] - Abre perfil completo
- [WhatsApp] - Link direto para conversar
- [Agendar] - Se for lead

---

## 🏢 Telas ADICIONAIS para GESTOR/ADMIN

Além das telas já definidas (Dashboard Executivo, Comercial, Agenda, Contact

os), o Gestor precisa de:

### **Tela 5: Gestão de Usuários**

**Objetivo**: Criar e gerenciar usuários (secretárias e terapeutas).

**Funcionalidades**:
- **Lista de usuários** (tabela)
- **Adicionar novo usuário** (modal/formulário)
- **Editar permissões**
- **Ativar/desativar usuário**

**Wireframe**:
```
┌─────────────────────────────────────────────────────────────────────┐
│ 👥 Gestão de Usuários                           [+ Adicionar Usuário]│
├─────────────────────────────────────────────────────────────────────┤
│ Nome         │ Email           │ Função      │ Status  │ Ações      │
├──────────────┼─────────────────┼─────────────┼─────────┼────────────┤
│ Maria Silva  │ maria@clinic.br │ Secretária  │ ✅ Ativo│ [Editar]   │
│ Dr. João     │ joao@clinic.br  │ Terapeuta   │ ✅ Ativo│ [Editar]   │
│ Dra. Ana     │ ana@clinic.br   │ Terapeuta   │ ✅ Ativo│ [Editar]   │
│ Pedro (ex)   │ pedro@clinic.br │ Terapeuta   │ 🔴 Inativo│ [Reativar]│
└──────────────┴─────────────────┴─────────────┴─────────┴────────────┘
```

**Modal "Adicionar Usuário"**:
- Nome completo
- Email
- Função (dropdown: Secretária, Terapeuta, Admin)
- Especialidades (se Terapeuta): checkboxes [ABA] [Fono] [TO] [Psico]
- Senha temporária (gerada automaticamente)

---

### **Tela 6: Configurações da Clínica**

**Objetivo**: Configurar informações da clínica.

**Seções**:

#### **6.1 Dados Gerais**
- Nome da clínica
- CNPJ
- Endereço
- Telefone / Email
- Horário de funcionamento

#### **6.2 Configurações de Agendamento**
- Duração padrão de sessões (ex: 2h)
- Intervalo entre sessões (ex: 15min)
- Horário de atendimento (ex: 8h - 18h)
- Dias de funcionamento (checkboxes: Seg-Dom)

#### **6.3 Integrações**
- WhatsApp (Uazapi): API Key, Status da conexão
- N8N: URL do servidor, Status
- Supabase: Status da conexão

**Wireframe**:
```
┌─────────────────────────────────────────────────────────────────┐
│ ⚙️ Configurações da Clínica                                     │
├─────────────────────────────────────────────────────────────────┤
│ 📋 Dados Gerais                                                 │
│ Nome: [Clínica Neurovida                    ]                   │
│ CNPJ: [12.345.678/0001-99                   ]                   │
│                                                                 │
│ 📅 Agendamento                                                  │
│ Duração padrão: [120] minutos                                  │
│ Intervalo: [15] minutos                                        │
│ Dias: ☑ Seg ☑ Ter ☑ Qua ☑ Qui ☑ Sex ☑ Sáb ☐ Dom             │
│                                                                 │
│ 🔌 Integrações                                                  │
│ WhatsApp (Uazapi): ✅ Conectado                                │
│ N8N: ✅ Conectado                                              │
│                                                [Salvar]        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🌐 Telas do SUPER ADMIN (Gabriel)

### **Tela 7: Dashboard Global (Multi-Tenant)**

**Objetivo**: Visão de todas as clínicas na plataforma.

**Métricas Globais**:
1. **Clínicas Ativas**: 12
2. **Total de Leads (todas clínicas)**: 345
3. **Total de Pacientes Ativos**: 1.240
4. **Taxa de Conversão Média**: 32%
5. **Uptime da Plataforma**: 99.8%

**Tabela de Clínicas**:
| Clínica | Status | Leads | Pacientes | Conversão | Último Acesso Admin |
|---------|--------|-------|-----------|-----------|---------------------|
| Clínica ABC | ✅ Ativa | 45 | 120 | 35% | Hoje, 10:32 |
| Clínica XYZ | ⚠️ Trial | 12 | 8 | 18% | Ontem |
| Clínica 123 | 🔴 Pausa | 0 | 0 | - | 15 dias atrás |

**Ações por clínica**:
- [Ver Dashboard] - Acessa painel da clínica (bypass RLS)
- [Logar como Admin] - Impersona o admin da clínica
- [Pausar/Reativar]
- [Ver Auditoria] - Logs detalhados

---

### **Tela 8: Gestão de Tenants**

**Objetivo**: Criar novas clínicas, editar configurações de tenants.

**Formulário "Criar Nova Clínica"**:
- Nome da clínica
- Email do admin (será criado automaticamente)
- Plano (Free Trial / Pago)
- Região do servidor (opcional)

**Wireframe**:
```
┌─────────────────────────────────────────────────────────────────┐
│ 🏢 Gestão de Tenants                        [+ Criar Nova Clínica]│
├─────────────────────────────────────────────────────────────────┤
│ ID                   │ Nome Clínica  │ Plano   │ Status   │ Ações│
├──────────────────────┼───────────────┼─────────┼──────────┼──────┤
│ abc-123-xyz          │ Clínica ABC   │ Trial   │ ✅ Ativa │ [...] │
│ def-456-uvw          │ Clínica XYZ   │ Pago    │ ✅ Ativa │ [...] │
│ ghi-789-rst          │ Clínica 123   │ Free    │ 🔴 Pausa │ [...] │
└──────────────────────┴───────────────┴─────────┴──────────┴──────┘
```

---

### **Tela 9: Auditoria Global**

**Objetivo**: Ver logs de auditoria de TODAS as clínicas.

**Filtros**:
- Por clínica (tenant_id)
- Por usuário (user_id)
- Por tipo de ação (create, update, delete)
- Por entidade (appointment, patient, lead)
- Por período

**Tabela de Logs**:
| Timestamp | Clínica | Usuário | Ação | Entidade | Detalhes |
|-----------|---------|---------|------|----------|----------|
| 07/02 10:32 | Clínica ABC | maria@clinic.br | update | appointment | Cancelou sessão de João |
| 07/02 09:15 | Clínica XYZ | admin@xyz.br | create | patient | Criou novo paciente Pedro |

---

### **Tela 10: Monitoramento de Infraestrutura**

**Objetivo**: Status técnico da plataforma.

**Widgets**:
1. **N8N Workflows**:
   - Total de workflows: 45
   - Execuções hoje: 1.234
   - Erros nas últimas 24h: 3
   - [Ver Logs N8N]

2. **Supabase**:
   - Conexões ativas: 23
   - Latência média: 45ms
   - Storage usado: 2.3 GB / 10 GB

3. **Uazapi (WhatsApp)**:
   - Mensagens enviadas hoje: 567
   - Taxa de entrega: 98%
   - Status da API: ✅ Online

4. **Erros Recentes**:
   - Tabela de últimos erros (logs de aplicação)
   - Stack trace
   - Filtro por severidade

---

## 💡 Sugestões Adicionais de Telas

### **RECEPÇÃO - Sugestões Extras**:

1. **Tela: Tickets de Escalação** (Human Handoff)
   - Lista de conversas onde Lívia escalou para humano
   - Status: Aberto, Em atendimento, Resolvido
   - Prioridade (Alta, Média, Baixa)

2. **Tela: Estatísticas Pessoais**
   - "Minha produtividade"
   - Leads convertidos por mim (este mês)
   - Tempo médio de resposta
   - Feedbacks positivos dos pais

---

### **GESTOR - Sugestões Extras**:

1. **Tela: Relatórios Personalizados**
   - Builder de relatórios (selecionar métricas)
   - Exportar para PDF/Excel
   - Agendamento de envio automático (ex: todo dia 1º do mês)

2. **Tela: Análise de Cancelamentos/No-Shows**
   - Quais pacientes faltam mais?
   - Quais terapeutas têm mais no-shows?
   - Motivos de cancelamento (tags)
   - Padrões detectados (ex: "quintas-feiras têm 3x mais faltas")

3. **Tela: Simulador de Receita**
   - "Se eu contratar mais 1 terapeuta..."
   - "Se a taxa de conversão subir para 40%..."
   - Projeções financeiras baseadas nos dados atuais

---

### **SUPER ADMIN - Sugestões Extras**:

1. **Tela: Feature Flags**
   - Ativar/desativar features por tenant
   - Ex: "Portal dos Pais" (beta para algumas clínicas)

2. **Tela: Billing & Payments** (Futuro)
   - Faturas geradas
   - Pagamentos recebidos
   - Cobrança automática

3. **Tela: Analytics Agregados**
   - Qual clínica tem maior taxa de conversão?
   - Qual agente N8N é mais usado?
   - Tendências da plataforma (crescimento mensal)

---

## 📊 Resumo de Telas por Persona

### **RECEPÇÃO (Operacional)**:
1. ✅ Home/Inicial ("O que fazer agora")
2. ✅ Comercial (Kanban de leads)
3. ✅ Agenda (Dia/Semana/Mês)
4. ✅ Contatos (Leads + Pacientes)
5. Tickets de Escalação (sugestão)
6. Estatísticas Pessoais (sugestão)

### **GESTOR (Estratégico)**:
1. ✅ Home/Inicial (Personalizada com métricas)
2. ✅ Dashboard Executivo (Funil, Performance)
3. ✅ Comercial (mesma da recepção)
4. ✅ Agenda (mesma da recepção)
5. ✅ Contatos (mesma da recepção)
6. ✅ Gestão de Usuários
7. ✅ Gestão de Terapeutas (Detalhes + Disponibilidade)
8. ✅ Configurações da Clínica
9. Relatórios Personalizados (sugestão)
10. Análise de Cancelamentos (sugestão)
11. Simulador de Receita (sugestão)

### **SUPER ADMIN (Plataforma)**:
1. ✅ Dashboard Global (Multi-Tenant)
2. ✅ Gestão de Tenants
3. ✅ Auditoria Global
4. ✅ Monitoramento de Infraestrutura
5. Feature Flags (sugestão)
6. Billing & Payments (futuro)
7. Analytics Agregados (sugestão)

---

## 🎯 Priorização para MVP

### **Must-Have (MVP Core)**:
- Recepção: Home, Comercial (Kanban), Agenda (3 visões), Contatos
- Gestor: Dashboard Executivo, Gestão de Usuários, Gestão de Terapeutas
- Super Admin: Dashboard Global, Gestão de Tenants

### **Should-Have (v1.1)**:
- Recepção: Tickets de Escalação
- Gestor: Configurações da Clínica, Análise de Cancelamentos
- Super Admin: Auditoria Global

### **Nice-to-Have (v2+)**:
- Recepção: Estatísticas Pessoais
- Gestor: Relatórios Personalizados, Simulador de Receita
- Super Admin: Feature Flags, Analytics Agregados, Billing

---

**Próximas Perguntas para Gabriel**:
1. Concorda com a priorização (Must/Should/Nice)?
2. Alguma tela crítica que esqueci?
3. Kanban de leads: Drag & drop é essencial ou pode ser botões?
4. Tela de Auditoria deve estar visível para Gestor ou só Super Admin?

— Atlas, investigando a verdade 🔎
