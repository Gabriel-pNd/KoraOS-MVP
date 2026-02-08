# 10 Pontos Cegos Críticos Adicionais - KoraOS MVP
## Analysis v2.0

**Data**: 2026-02-07  
**Analista**: Atlas  
**Contexto**: Análise profunda de todo o projeto para identificar riscos não mapeados

---

## 🔍 Arquitetura de Dados: Telefones Compartilhados (Esclarecimento)

### Problema Atual
Um telefone (11-9999-0000) pode ser de:
- Mãe com 3 filhos pacientes
- Avó com neto e marido idoso como pacientes
- Pai que já foi lead, agora tem 2 filhos convertidos, e depois vira lead de novo para o 3º filho

### Solução Proposta: Modelo de "Contato"

**Nova Entidade**: `contacts`
```sql
CREATE TABLE contacts (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  phone TEXT NOT NULL, -- 11-9999-0000
  name TEXT, -- Nome da pessoa que possui o telefone
  email TEXT,
  relationship_type TEXT, -- 'mother', 'father', 'guardian', 'self'
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(tenant_id, phone) -- 1 TELEFONE = 1 CONTATO
);

CREATE TABLE patients (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  contact_id UUID REFERENCES contacts(id), -- NOVO: vincula ao contato
  name TEXT, -- Nome da criança/paciente
  birth_date DATE,
  diagnosis TEXT,
  -- SEM UNIQUE no telefone aqui
);

CREATE TABLE leads (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  contact_id UUID REFERENCES contacts(id), -- NOVO: vincula ao contato
  child_name TEXT,
  status TEXT,
  -- SEM UNIQUE no telefone aqui
);
```

### Como Funciona
1. **WhatsApp recebe mensagem de 11-9999-0000**:
   - Sistema verifica se já existe `contact` com esse telefone.
   - Se não: Cria `contact` novo.
   - Se sim: Reutiliza.

2. **Lívia conversa**:
   - Se a Maria diz "Quero agendar para meu filho João", cria `lead` vinculado ao `contact` da Maria.
   - Se ela diz "Também quero para minha filha Ana", cria OUTRO `lead` vinculado ao MESMO `contact`.

3. **Conversão**:
   - Quando João vira paciente, ele vai para `patients` vinculado ao `contact`.
   - Quando Ana vira paciente, ela TAMBÉM vai para `patients` vinculado ao MESMO `contact`.

4. **Interface (Web App)**:
   - Secretária vê: **"Maria Silva (11-9999-0000)"** (Contato)
   - Ao clicar, vê:
     - **Pacientes**: João (5 anos, TEA), Ana (3 anos, ADHD)
     - **Leads Ativos**: Pedro (em_qualificacao)

### Vantagens
- ✅ 1 telefone = 1 canal de comunicação (sem duplicatas)
- ✅ Histórico único de conversas (todas vinculadas ao `contact`)
- ✅ Suporta N pacientes e N leads no mesmo número
- ✅ Lívia sabe o contexto completo: "Você já tem 2 filhos conosco, certo Maria?"

**Aprovação Necessária**: Esta arquitetura resolve seu caso de uso?

---

## 🚨 10 Novos Pontos Cegos Críticos

### 1. **Conflito de Agendamento entre Irmãos**
**Problema**: Mãe tem 2 filhos (João e Ana) agendados no mesmo horário com terapeutas diferentes. Lívia tenta agendar os dois às 14h da próxima terça. A mãe não pode levar ambos ao mesmo tempo se os atendimentos são em salas diferentes.

**Risco**: Lógica de agendamento sequencial não considera que o **MESMO responsável** não pode estar em dois lugares ao mesmo tempo.

**Solução Proposta**:
- No Nest.js, ao sugerir horários, verificar se o `contact_id` já tem agendamento naquele horário para outro paciente.
- **Regra**: Se João está agendado Terça 14h, Ana NÃO pode ser agendada Terça 14h. O sistema sugere 16h (após João).
- **UI**: Alerta visual: "Atenção: Responsável já tem agendamento às 14h (João - ABA)".

**Aprovação**: ⬜ Sim / ⬜ Não / ⬜ Modificar

---

### 2. **Secretária Edita Agendamento Criado pela Lívia (Sem Auditoria Clara)**
**Problema**: Lívia agenda João para Terça 14h com Dra. Ana. Secretária move manualmente para Quarta 16h com Dr. Pedro. No histórico, fica confuso "quem decidiu o quê".

**Risco**: Mãe reclama "Lívia disse que era Terça 14h!". Secretária não consegue provar que a mudança foi necessária (conflito).

**Solução Proposta**:
- Criar flag no `appointments`: `created_by: 'ia' | 'web_app' | 'manual'`
- Quando secretária edita, adicionar campo `modified_reason` (obrigatório): "Terapeuta de férias", "Paciente pediu mudança".
- **Histórico Visual**: Timeline estilo GitHub:
  ```
  [14:32] IA (Lívia) criou agendamento: Terça 14h - Dra. Ana
  [15:00] Maria (Secretária) reagendou para Quarta 16h - Dr. Pedro
          Motivo: "Dra. Ana ficou doente"
  ```

**Aprovação**: ⬜ Sim / ⬜ Não / ⬜ Modificar

---

### 3. **Lívia Marca Agendamento Sem Confirmar com a Mãe**
**Problema**: Em uma conversa longa, Lívia pode "entender errado" que a mãe confirmou um horário e criar o agendamento no banco. A mãe depois diz "Eu não confirmei isso!".

**Risco**: Slots bloqueados indevidamente. Frustração do cliente.

**Solução Proposta**:
- **Confirmação Explícita Obrigatória**: Antes de chamar a tool `criar_agendamento`, Lívia SEMPRE pergunta:
  > "Perfeito! Vou confirmar então:
  > - João: Terça 14h (Fono - Dra. Ana)
  > - Ana: Terça 16h (ABA - Dr. Pedro)
  > 
  > **Digite CONFIRMAR para eu finalizar o agendamento.**"
  
- Só cria no banco após receber palavra-chave "CONFIRMAR" ou "SIM, CONFIRMA".

**Aprovação**: ⬜ Sim / ⬜ Não / ⬜ Modificar

---

### 4. **AI Failure Durante Horário de Atendimento (Refinamento)**
**Problema**: Como sugerido, só enviar mensagem automática se clínica estiver fechada. Mas como o sistema sabe se está aberto ou fechado?

**Solução Proposta**:
- Nova tabela: `clinic_hours` (por tenant)
  ```sql
  CREATE TABLE clinic_hours (
    tenant_id UUID,
    day_of_week INT, -- 0=Dom, 1=Seg, ..., 6=Sáb
    opens_at TIME, -- 08:00
    closes_at TIME, -- 18:00
    is_closed BOOLEAN DEFAULT false -- Marcado como fechado
  );
  ```
- **Lógica no N8N** (Error Trigger):
  ```
  IF current_time BETWEEN opens_at AND closes_at:
      → APENAS criar ticket urgente (sem mensagem ao cliente)
  ELSE:
      → Criar ticket + enviar mensagem automática
  ```

**Aprovação**: ⬜ Sim / ⬜ Não / ⬜ Modificar

---

### 5. **Perda de Mensagens Durante Manutenção do N8N**
**Problema**: Se o servidor N8N cair ou estiver em manutenção, mensagens do WhatsApp chegam mas não são processadas. Quando volta, essas mensagens se perderam.

**Risco**: Cliente manda "Quero cancelar" durante a manutenção. Sistema não processa. Paciente falta e fica bravo.

**Solução Proposta**:
- **Queue Persistente**: Usar Redis ou PostgreSQL como fila.
- Webhook da Uazapi NÃO vai direto pro N8N. Vai para um endpoint do **Nest.js** que:
  1. Salva a mensagem RAW na tabela `message_queue` (status: pending)
  2. Retorna 200 OK para Uazapi (garantindo ACK)
  3. N8N puxa dessa fila (polling a cada 5s)
  4. Após processar, marca como `processed`

**Vantagem**: Se N8N cai, mensagens ficam na fila. Quando volta, processa tudo.

**Aprovação**: ⬜ Sim / ⬜ Não / ⬜ Modificar

---

### 6. **Secretária Deleta Lead por Engano (Soft Delete Insuficiente)**
**Problema**: Soft delete salva no `deleted_at`, mas se a secretária deletar por engano, ela mesma não consegue "desfazer". Precisa pedir ao gestor.

**Risco**: Frustração operacional.

**Solução Proposta**:
- **Lixeira Temporária (30 dias)**:
  - Itens deletados vão para aba "Lixeira" (visível para quem deletou).
  - Botão **"Restaurar"** disponível por 30 dias.
  - Após 30 dias, item some da lixeira (mas continua no banco para auditoria).
- **Permissão**: Secretária pode restaurar **seus próprios** deletados. Gestor pode restaurar de qualquer um.

**Aprovação**: ⬜ Sim / ⬜ Não / ⬜ Modificar

---

### 7. **Follow-up Enviado para Número Bloqueado/Inativo**
**Problema**: Cliente bloqueou o número da clínica no WhatsApp ou trocou de número. Sistema continua tentando follow-up eternamente (desperdício de recursos).

**Risco**: Poluição de logs, gasto de API calls.

**Solução Proposta**:
- Uazapi retorna erro específico quando número está bloqueado/inativo.
- N8N detecta esse erro e marca o lead como `status: unreachable`.
- **UI**: Leads "Unreachable" vão para aba separada. Gestor pode revisar e marcar como perdido ou tentar outro canal (email/telefone fixo).

**Aprovação**: ⬜ Sim / ⬜ Não / ⬜ Modificar

---

### 8. **Cadastro de Feriados: Estados e Municípios**
**Problema**: Feriados nacionais são fixos. Mas feriados estaduais (ex: Revolução Constitucionalista em SP - 09/07) e municipais (Aniversário da cidade) variam.

**Risco**: Se a clínica da cidade X está fechada no aniversário da cidade, mas o sistema não sabe, envia lembretes.

**Solução Proposta**:
- **Pré-cadastro Inteligente**:
  - Na criação do tenant, perguntar: "Cidade da Clínica?" (ex: São Paulo/SP)
  - Sistema pré-cadastra:
    - Feriados nacionais (fixos)
    - Feriados estaduais de SP
    - Feriado municipal de São Paulo (25/01 - Aniversário)
- **API Externa** (opcional v1.1): Usar API como `brasilapi.com.br/api/feriados/v1/{ano}` para auto-update.

**Aprovação**: ⬜ Sim / ⬜ Não / ⬜ Modificar

---

### 9. **Terapeuta Sai da Clínica (Transferência de Pacientes)**
**Problema**: Dr. João sai da clínica. Ele tem 15 pacientes ativos. Sistema não tem fluxo para transferir esses pacientes para outro terapeuta.

**Risco**: Agendamentos futuros ficam "órfãos". Secretária precisa editar 50+ agendamentos manualmente.

**Solução Proposta**:
- **Wizard de Transferência**:
  1. Gestor clica em "Desligar Terapeuta"
  2. Sistema lista pacientes ativos do terapeuta
  3. Para cada paciente, permite escolher novo terapeuta
  4. **Batch Update**: Transfere TODOS os agendamentos futuros automaticamente
  5. Notifica pacientes via WhatsApp: "Oi Maria, Dr. João não atende mais na clínica. Seus próximos agendamentos serão com Dra. Ana (CRFa 2-12345). Alguma dúvida?"

**Aprovação**: ⬜ Sim / ⬜ Não / ⬜ Modificar

---

### 10. **Limites de Armazenamento (Storage) Atingidos**
**Problema**: Se clínicas enviarem MUITOS laudos/fotos (dezenas por dia), em 6 meses pode acumular 50GB+. Supabase cobra por GB.

**Risco**: Custo operacional alto. Cliente não avisado.

**Solução Proposta**:
- **Política de Retenção**:
  - Documentos com mais de 2 anos são movidos para "Cold Storage" (mais barato).
  - Imagens processadas (após extração de texto) podem ser comprimidas (quality 70%).
- **Alertas de Quota**:
  - Se tenant ultrapassar 10GB, notificar gestor: "Você está próximo do limite de armazenamento. Considere revisar documentos antigos."
- **Plano de Expansão** (v1.1): Cobrar R$ X/GB adicional ou oferecer plano "Unlimited Storage".

**Aprovação**: ⬜ Sim / ⬜ Não / ⬜ Modificar

---

## 📊 Resumo dos Pontos Cegos

| # | Ponto Cego | Severidade | Complexidade Solução |
|---|------------|-----------|---------------------|
| 1 | Conflito agendamento irmãos | 🔴 Alta | Média |
| 2 | Auditoria de edições manuais | 🟡 Média | Baixa |
| 3 | Lívia confirma sem aprovação | 🔴 Alta | Baixa |
| 4 | AI Failure (horário clínica) | 🟡 Média | Baixa |
| 5 | Perda de mensagens (N8N down) | 🔴 Alta | Alta |
| 6 | Restore de deletados | 🟡 Média | Média |
| 7 | Follow-up em número bloqueado | 🟡 Média | Baixa |
| 8 | Feriados estaduais/municipais | 🟢 Baixa | Média |
| 9 | Transferência de pacientes | 🟡 Média | Média |
| 10 | Limites de storage | 🟢 Baixa | Média |

---

**Próximo Passo**: Aguardando aprovação de Gabriel para incorporar as soluções aprovadas no Brief v3.1.

— Atlas, investigando a verdade 🔎
