# Dores Clínicas TEA

# **Análise Estratégica KoraOS: Fricção Operacional, Burnout Clínico e a Dinâmica do Churn em Clínicas de ABA no Brasil**

## **Sumário Executivo: O Modelo Iceberg na Gestão do Autismo**

O mercado brasileiro de terapias especializadas no Transtorno do Espectro Autista (TEA), especificamente a Análise do Comportamento Aplicada (ABA), atravessa um momento de inflexão crítica. Vivemos o paradoxo da demanda reprimida versus a fragilidade operacional. Enquanto a prevalência de diagnósticos explode — com estimativas sugerindo números próximos a 2 milhões de pessoas no Brasil 1 e uma incidência global que já atinge 1 em cada 36 crianças segundo o CDC 1 — a infraestrutura operacional das clínicas está fraturando sob o peso de uma complexidade administrativa sem precedentes.

Este relatório, desenvolvido sob a perspectiva de Pesquisa de Experiência do Usuário (UX) e Estratégia de Operações Clínicas, utiliza o **Modelo Iceberg** para dissecar as disfunções sistêmicas que assolam as clínicas de ABA. Na ponta visível do iceberg, observamos as hemorragias financeiras óbvias: glosas médicas que corroem até 15% do faturamento, o *turnover* (rotatividade) alarmante de terapeutas e o *churn* (cancelamento) de famílias que migram entre clínicas ou judicializam o tratamento.

No entanto, a massa submersa e invisível deste iceberg é composta pelo "trabalho fantasma": a entrada manual de dados que consome as noites dos terapeutas, a sobrecarga cognitiva das equipes clínicas lutando contra interfaces hostis, a "fadiga de WhatsApp" das secretarias que operam como centros de crise não oficiais, e a ansiedade profunda das famílias que, alienadas por relatórios técnicos ininteligíveis, perdem a fé no tratamento.

A validação das hipóteses técnicas desta *Deep Research* aponta para uma conclusão inequívoca: o mercado não precisa de mais um "sistema de gestão" genérico. O mercado clama por uma plataforma de **Tecnologia Calma** (*Calm Technology*) que atue como um escudo contra a burocracia da saúde suplementar e como um tradutor de valor para as famílias. A barreira de migração, frequentemente atribuída à preguiça ou custo, revela-se, na verdade, um "Síndrome de Refém" baseada no medo da perda de dados clínicos históricos.

## **Parte I: A Ponta do Iceberg – Vulnerabilidade Financeira e Vazamento de Receita**

Para gestores e proprietários de clínicas, as dores são imediatas, quantificáveis e, frequentemente, letais para o fluxo de caixa. A pesquisa revela que o ciclo de receita em clínicas de ABA é fundamentalmente diferente e mais complexo do que em clínicas médicas tradicionais, exigindo ferramentas específicas que os softwares atuais (ERPs genéricos) falham em entregar.

### **1.1 O Ecossistema de Glosas: A Erosão Administrativa das Margens de Lucro**

No contexto da saúde suplementar brasileira, as "glosas" (recusas de pagamento por parte das operadoras de planos de saúde) não representam apenas um atraso administrativo; elas constituem um risco existencial direto à sustentabilidade financeira das instituições.3 Diferente de uma consulta médica pontual, o tratamento ABA envolve terapia intensiva (frequentemente 20 a 40 horas semanais), gerando um volume massivo de guias TISS (Troca de Informação de Saúde Suplementar). Um único erro de codificação pode resultar no não pagamento de um mês inteiro de tratamento de um paciente, criando rombos de fluxo de caixa de dezenas de milhares de reais.

### **Anatomia da Glosa no Contexto ABA**

A complexidade do faturamento de ABA é exacerbada pela natureza multidisciplinar e pela frequência das sessões. A pesquisa identifica três categorias principais de glosas que o KoraOS deve endereçar tecnicamente:

| **Tipo de Glosa** | **Causa Raiz no Contexto ABA** | **Impacto Operacional e Financeiro** |
| --- | --- | --- |
| **Glosa Administrativa** | Erros de digitação em números de carteirinha, guias com campos obrigatórios em branco, uso de tabelas de domínio desatualizadas ou falhas no cadastro do beneficiário.4 | Interrupção imediata do fluxo de caixa. Exige retrabalho da equipe de faturamento para corrigir e reenviar, atrasando o recebimento em 30 a 60 dias. |
| **Glosa Técnica** | A operadora questiona a *pertinência clínica* do procedimento, a qualificação do profissional (ex: Atendente Terapêutico vs. Supervisor) ou a ausência de evolução documentada nos prontuários.4 | O mais oneroso tipo de glosa. Exige que o Diretor Clínico ou Supervisor pare de atender para redigir defesas técnicas detalhadas, consumindo horas sêniores caríssimas. |
| **Glosa Linear / Auditoria** | Cortes automáticos baseados em algoritmos de "teto de frequência" ou padrões de uso, muitas vezes ignorando as resoluções da ANS que derrubaram limites de sessões para TEA.6 | Gera um ambiente adversarial. Clínicas menores frequentemente aceitam o prejuízo por falta de estrutura jurídica para contestar em massa. |

O Custo Operacional da Recuperação (OpEx Invisível):

O impacto financeiro das glosas é duplo. Primeiro, há a perda direta de receita ou o custo de oportunidade do capital parado. Segundo, e frequentemente ignorado nas análises superficiais, é o aumento da Despesa Operacional (OpEx). Hospitais e clínicas são forçados a investir pesadamente em departamentos inteiros de "Recurso de Glosas", contratando pessoal administrativo e adquirindo softwares de auditoria secundários apenas para contestar as negativas.8 Estudos de caso em redes hospitalares mostram índices de glosa chegando a 67,6% em certos contratos, o que evidencia uma falha sistêmica nos processos de pré-validação.6

Validação de Hipótese Técnica:

Os gestores estão desesperados por um "Escudo contra Glosas". A hipótese de que uma ferramenta de auditoria pré-submissão seria um diferencial competitivo massivo está validada. Softwares que operam apenas como repositórios passivos de dados (onde o usuário digita o que quer e o sistema gera o XML) são insuficientes. O sucesso de soluções de nicho como a Carefy, que promete até 97% de acurácia na identificação de glosas 9, demonstra que a inteligência artificial aplicada à auditoria de contas médicas é uma necessidade, não um luxo. Para o neuro, implementar um validador de regras da ANS e das operadoras específicas antes do envio do lote XML é a funcionalidade "matadora" para o persona do Gestor Financeiro.10

### **1.2 A Caixa Preta da Rentabilidade: O Desafio da "Hora Clínica"**

Muitos gestores de clínicas de autismo operam em um estado de cegueira financeira parcial. Eles conhecem o faturamento bruto, mas desconhecem a margem real por paciente ou por terapeuta. O conceito de "Hora Clínica" — o custo total de manter a clínica aberta dividido pelas horas produtivas — é frequentemente mal calculado ou ignorado.12

No setor de ABA, essa análise é complicada pelo modelo de "Pirâmide de Supervisão". Uma clínica cobra um valor "blendado" ou diferenciado por hora, mas paga salários vastamente diferentes para um Analista do Comportamento (Supervisor/Doutor) versus um Acompanhante Terapêutico (Aplicador/Estagiário). Sem um rastreamento preciso de *quem* realizou *qual* serviço por *quanto tempo*, a análise de lucratividade torna-se um exercício de adivinhação.

Sistemas que falham em segregar essas camadas hierárquicas e seus respectivos custos levam a cenários onde clínicas podem estar perdendo dinheiro em casos intensivos (40 horas/semana com alta supervisão) sem perceber até o fechamento do balanço trimestral.14 A falta de integração entre o agendamento clínico e o módulo financeiro impede a visão de indicadores cruciais como o "Ticket Médio por Paciente" e a "Margem de Contribuição por Terapeuta".16

## **Parte II: A Massa Submersa – A Crise do Terapeuta (Burnout e Turnover)**

Descendo abaixo da linha d'água do iceberg, encontramos o ativo operacional mais crítico e, paradoxalmente, mais negligenciado de uma clínica ABA: o terapeuta. A pesquisa pinta um quadro sombrio da condição laboral atual, caracterizada pelo "Ciclo de Burnout-Turnover".

### **2.1 O Trabalho Invisível: "Trabalhando de Graça"**

Uma dor profunda e universal entre os profissionais de ABA é a discrepância abismal entre as *horas faturáveis* (tempo de interação direta com a criança) e as *horas trabalhadas* (entrada de dados, geração de gráficos, redação de relatórios). A literatura e os relatos de campo indicam que a carga administrativa é um dos principais vetores de exaustão profissional.17

O Abismo "Papel-Digital":

Apesar da onipresença da tecnologia, uma porção significativa da coleta de dados em ABA no Brasil ainda é baseada em papel ou híbrida (Prancheta + Excel). Terapeutas registram a frequência de comportamentos ou resultados de tentativas discretas (DTT) em folhas de papel durante as sessões para evitar quebrar o vínculo e o contato visual com a criança.19 O uso de tecnologia não adaptada (laptops ou sistemas desktop lentos) interfere na fluidez da terapia, forçando o profissional a escolher entre a qualidade do atendimento e a precisão do registro.

O "Segundo Turno" Não Remunerado:

A consequência do registro em papel é o "Segundo Turno". Após o encerramento da clínica, os terapeutas enfrentam a tarefa hercúlea de transcrever dados das folhas de registro para planilhas ou softwares legados para gerar os gráficos de evolução exigidos pelos supervisores e planos de saúde. Isso cria um cenário onde profissionais trabalham horas extras não remuneradas todas as noites.17

Esta incapacidade de "desconectar" é um motor primário de burnout. Pesquisas indicam que 70% dos profissionais que sentem a necessidade de responder a demandas ou realizar tarefas fora do expediente apresentam níveis elevados de estresse.17 Na área de ABA, onde as demandas emocionais já são extremas devido à natureza da patologia e à interação com famílias em crise, essa carga administrativa adicional é catastrófica para a saúde mental.20

**Análise de Processo: A Fricção do Dado Manual**

1. **Evento:** A criança emite um comportamento-alvo (ex: "mando" por água).
2. **Captura:** O terapeuta marca um traço em uma folha de papel ou clica em um contador manual.19
3. **Risco:** O papel pode ser perdido, rasurado, ou a caligrafia mal interpretada.
4. **Transcrição:** O terapeuta digita os dados no Excel às 20h00.
5. **Visualização:** O terapeuta ajusta manualmente os eixos do gráfico para mostrar a linha de tendência.
6. **Análise:** O Supervisor revisa o gráfico 3 a 7 dias depois.
- *Resultado Crítico:* O ciclo de feedback é atrasado em mais de 72 horas. Se a intervenção não está funcionando, a criança perde dias de aprendizado potencial antes que o programa seja ajustado.

**Oportunidade KoraOS:** A coleta de dados *mobile-first* e *offline-capable* é inegociável. Aplicativos que permitem a entrada de dados com "um toque" e sincronização automática com o prontuário eletrônico eliminam o "Segundo Turno", devolvendo qualidade de vida ao terapeuta e precisão clínica ao tratamento.22

### **2.2 O Imposto do Turnover (A Taxa de Rotatividade)**

O *turnover* em clínicas de ABA não é apenas um problema de Recursos Humanos; é um desastre clínico. A alta rotatividade de pessoal está diretamente ligada à perda de qualidade terapêutica e à insatisfação das famílias.

- **Custo Econômico:** Substituir um funcionário custa recursos significativos em recrutamento, integração e treinamento. Além disso, há o "ramp-up" de produtividade do novo contratado.24
- **Custo Clínico (Ruptura de Vínculo):** Crianças com autismo dependem pesadamente de rotina e vínculo afetivo. Quando um terapeuta sai, o "pareamento" (bonding) é quebrado. A criança pode regredir, comportamentos disruptivos podem ressurgir, e o novo terapeuta pode levar semanas para alcançar o mesmo nível de controle instrucional.26
- **Reação da Família:** Os pais percebem a alta rotatividade como um sinal de incompetência administrativa da clínica ("Por que eles não conseguem segurar os bons profissionais?"). Isso alimenta diretamente o ciclo de *churn* das famílias, que perdem a confiança na instituição.27

**Validação de Hipótese:** Terapeutas deixam seus empregos devido ao *burnout* e à *falta de suporte*, e não apenas por salário. Um software que reduz drasticamente a carga burocrática atua efetivamente como uma ferramenta de retenção de talentos, permitindo que o terapeuta foque no que ama fazer: tratar a criança.18

## **Parte III: O Gargalo Operacional – O "Inferno do WhatsApp" da Secretaria**

A recepcionista ou secretária clínica opera em um ambiente de alto estresse que serve como o sistema nervoso central da clínica. Seus pontos de dor são caracterizados por volume excessivo, urgência constante e a necessidade de contenção emocional de pais ansiosos.

### **3.1 O Dilúvio da Comunicação Fragmentada**

As clínicas brasileiras hoje operam primariamente via WhatsApp, ferramenta que se tornou uma faca de dois gumes.

- **Volume Ingerenciável:** Secretárias gerenciam centenas de mensagens diariamente: alterações de agendamento, solicitações de notas fiscais, cancelamentos de última hora e dúvidas ansiosas de pais.30
- **Fragmentação Cognitiva:** A natureza "always-on" da mensageria instantânea leva à alternância constante de tarefas. Uma secretária não consegue focar em uma tarefa complexa de faturamento ou autorização de guias porque é bombardeada a cada minuto por mensagens triviais como "O doutor já chegou?".31
- **O "Buraco Negro" da Informação:** Sem um CRM centralizado ou sistema de *ticketing*, mensagens são lidas e esquecidas, ou "enterradas" no histórico do chat. Isso leva a agendamentos perdidos, recados não dados e clientes frustrados que sentem que a clínica é desorganizada.30

### **3.2 A Economia do "No-Show" e a Triagem Falha**

Para clínicas de ABA, o "No-Show" (não comparecimento sem aviso) é economicamente devastador. Diferente de uma consulta médica de 15 minutos, uma sessão de ABA pode durar de 2 a 4 horas. Um paciente que falta cria um "buraco" de receita massivo que não pode ser preenchido por um paciente de encaixe.7

- **Confirmação Manual:** Secretárias gastam horas preciosas do dia confirmando manualmente compromissos via WhatsApp ou telefone. Se falham nessa tarefa repetitiva, a taxa de no-show dispara.
- **Falha na Triagem:** A triagem inadequada, muitas vezes feita sem o auxílio de inteligência de dados, leva a erros de agendamento (ex: agendar uma criança com histórico de agressividade severa com um terapeuta júnior ou em um horário de pico na recepção). Isso causa crises comportamentais na sala de espera que a secretária, muitas vezes sem treinamento clínico, precisa gerenciar, aumentando seu nível de estresse e risco de burnout.33

**Validação de Hipótese:** A automação do agendamento e da confirmação (via IA ou chatbots integrados ao sistema de gestão) não é apenas uma questão de eficiência operacional; é uma questão de *saúde mental* para a equipe de recepção e de *proteção de receita* para a clínica.35

## **Parte IV: A Dinâmica do Churn – Por Que as Famílias Vão Embora**

A percepção de valor por parte das famílias é o fator determinante para a retenção (LTV - Lifetime Value). A pesquisa valida uma relação direta e causal entre **Relatórios Técnicos Complexos** e o **Churn Familiar**.

### **4.1 A "Caixa Preta" do Relatório ABA**

A ABA é uma ciência baseada em dados. No entanto, esses dados são frequentemente apresentados de maneira ininteligível para o leigo (o pai ou a mãe).

- **O Abismo Linguístico:** Pais recebem relatórios repletos de jargões técnicos ("burst de extinção", "reforço diferencial", "tentativas discretas", "esquema de razão variável") e gráficos de linha complexos sem contexto narrativo. Eles não veem "progresso"; eles veem "linhas" e "palavras difíceis".38
- **A Percepção de Estagnação:** Se uma criança está progredindo lentamente em pré-requisitos (ex: contato visual, sentar-se) mas ainda não fala, um gráfico técnico pode mostrar "sucesso" na aquisição do comportamento de sentar. O pai, contudo, focado na fala, vê "fracasso". Quando os pais não conseguem interpretar o valor pelo qual estão pagando (ou lutando contra o plano de saúde para manter), eles assumem que a terapia não está funcionando.38
- **A Exclusão do Processo:** Pais frequentemente se sentem excluídos. Quando relatórios são gerados apenas para justificativa de seguro (compliance) e não para educação da família, os pais se sentem como meros "pagadores" ou "transportadores" da criança, e não como parceiros terapêuticos essenciais.40

### **4.2 O Ciclo Emocional do Churn**

A jornada da família no ecossistema do autismo é marcada por estresse crônico.41 O *churn* não é um evento súbito, mas o resultado de um ciclo de desgaste:

1. **Estágio 1: Esperança e Investimento:** A família luta pelo diagnóstico e pela cobertura do plano de saúde, muitas vezes via liminar judicial. A expectativa é alta.
2. **Estágio 2: A Caixa Preta:** A terapia começa. A criança entra na sala; o pai espera fora. O feedback é informal e apressado na recepção. Relatórios formais são esporádicos e confusos.43
3. **Estágio 3: Dúvida e Ansiedade:** "Está funcionando?" "Por que ele ainda é agressivo?" A falta de *feedback* claro e acessível alimenta a desconfiança.44
4. **Estágio 4: O Gatilho:** Um erro de faturamento, uma mudança de terapeuta (turnover) ou uma sessão negada pelo plano (glosa). A fragilidade da confiança construída nos estágios anteriores não suporta o erro.
5. **Estágio 5: Churn e Litígio:** A família retira a criança, muitas vezes registrando reclamações na ANS ou processando a clínica por negligência ou falta de evolução, causando danos financeiros e reputacionais severos.45

**Insight Estratégico:** O relatório é o *produto* tangível para o pai. O KoraOS deve reinventar o relatório. Ele não deve ser apenas um "Documento de Compliance" para o auditor do plano; ele deve ser um "Diário de Vitórias" para a família. A solução envolve traduzir "80% de acurácia em mandos" para "O João pediu água sozinho 8 vezes hoje". O uso de IA Generativa para criar resumos narrativos amigáveis é uma funcionalidade crítica para reduzir o *churn*.47

## **Parte V: Hipóteses Técnicas e a Barreira de Migração**

Por que as clínicas permanecem utilizando softwares legados, subótimos e cheios de bugs, apesar de todas essas dores? A pesquisa identifica uma profunda **"Síndrome de Refém"** em relação aos dados, criando uma barreira de migração psicológica e técnica.

### **5.1 O Medo da Perda de Dados (A Barreira de Migração)**

Gestores de clínicas têm pavor de migração de sistemas. O dado do paciente é o ativo mais valioso da clínica, e o histórico de evolução clínica é legalmente exigido pelos conselhos de classe e pela ANS.

- **Histórias de Horror:** O mercado está repleto de relatos de corrupção de dados, prontuários perdidos e "meses perdidos" de agendamento durante processos de migração mal executados.49
- **Vendor Lock-in (Aprisionamento Tecnológico):** Concorrentes e softwares legados frequentemente dificultam a exportação de dados. As informações são extraídas em formatos fragmentados (PDFs estáticos em vez de bancos de dados estruturados CSV/SQL/JSON), tornando a importação para um novo sistema cara, demorada e arriscada.51
- **Inércia e Aversão à Perda:** "Melhor o diabo que você conhece". Gestores preferem lidar com um sistema lento e cheio de falhas que eles já entendem do que arriscar um "transplante falho" para um sistema novo, que poderia paralisar a operação por semanas.52

Implicação Estratégica para o KoraOS:

Marketing focado apenas em "funcionalidades melhores" é insuficiente. Para ganhar o mercado, o KoraOS deve vender "Migração Sem Risco". Isso implica oferecer um serviço de concierge onde a equipe técnica do KoraOS assume a responsabilidade pela extração, limpeza e importação dos dados, garantindo 100% de integridade. Isso endereça a barreira psicológica do medo.53

### **5.2 A Necessidade de "Calm UX" (Tecnologia Calma) na Saúde**

O conceito de "Calm Technology" é crítico para o diferencial do produto. Ambientes de saúde são intrinsecamente estressantes e repletos de ruído cognitivo. O software não deve adicionar a esse estresse.55

- **Carga Cognitiva e Erro Clínico:** Clínicos já estão processando quantidades massivas de dados comportamentais. Uma Interface de Usuário (UI) poluída, que usa cores alarmistas (vermelho para tudo), notificações excessivas ou que exige muitos cliques para tarefas simples, aumenta a carga cognitiva. Estudos mostram que interfaces de Prontuário Eletrônico (EHR) mal projetadas contribuem diretamente para o erro médico e o burnout.56
- **Design Inclusivo e Neurodivergente:** Muitos profissionais no campo podem ser neurodivergentes, e certamente os pacientes são. Uma interface "barulhenta" é contraproducente. O design deve priorizar a clareza, o espaço em branco e a redução de estímulos desnecessários.59
- **UX como Ferramenta Clínica:** Uma interface limpa e "Calma", que utiliza a *divulgação progressiva* (mostrando apenas o que é necessário para o momento), pode efetivamente reduzir o burnout. Ela muda a relação do usuário com o software de "adversário burocrático" para "assistente clínico".61

## **Parte VI: Cenário Competitivo e Lacunas de Mercado**

O mercado brasileiro contém *players* estabelecidos como Comportatudo, NeoABA e softwares médicos genéricos (Amplimed, Feegow), mas lacunas significativas permanecem.

| **Concorrente** | **Forças Percebidas** | **Fraquezas (Baseado em Feedback de Usuários)** |
| --- | --- | --- |
| **Comportatudo** | Forte reconhecimento de marca no nicho ABA; pioneirismo. | Reclamações recorrentes sobre ineficiência do suporte técnico; instabilidade do sistema; lentidão na atualização de dados.62 |
| **NeoABA** | Especialização profunda em protocolos ABA (VB-MAPP, ABLLS); foco em currículo. | Problemas de usabilidade em dispositivos móveis; falta de clareza sobre capacidades offline em documentação pública; reclamações sobre "sistema fora do ar".64 |
| **ERPs Genéricos (Feegow, Amplimed, iClinic)** | Robustez financeira e de faturamento; estabilidade de servidor; agendamento médico padrão. | Falta de profundidade *clínica* para ABA (coleta de dados tentativa-a-tentativa, gráficos comportamentais complexos); rigidez para terapias multidisciplinares seriadas.11 |
| **Carefy / Auditorias** | Alta precisão na detecção de glosas (foco hospitalar). | Soluções focadas apenas em auditoria, não integradas ao fluxo clínico diário do terapeuta ABA.9 |

**A Lacuna de Mercado:** Não existe um player dominante que integre perfeitamente **Robustez Financeira (Auditoria de Glosas Automática)** com **Usabilidade Clínica Profunda (App Offline e Coleta de Dados Ágil)** e **Engajamento Familiar (Relatórios Inteligíveis)**. O mercado está fragmentado entre ferramentas financeiras que não entendem de autismo e ferramentas de autismo que são fracas em gestão financeira.

## **Parte VII: Recomendações Estratégicas para o KoraOS**

Com base nesta pesquisa aprofundada, os seguintes pilares estratégicos são recomendados para o *roadmap* de produto e estratégia de *Go-to-Market* do KoraOS:

### **7.1 Estratégia de Produto: O Motor "Anti-Burnout"**

1. **Mobile-First e Offline-First Real:** O aplicativo do terapeuta deve ser à prova de falhas. Ele deve funcionar sem internet (atendimento domiciliar/home care) e sincronizar instantaneamente assim que a conexão for restabelecida. Ele deve substituir a prancheta de papel, não apenas a planilha de Excel. A interface deve ser desenhada para uso com uma mão só (já que a outra está interagindo com a criança).19
2. **Auditoria de Glosas Automatizada (Revenue Assurance):** Implementar uma "Camada de Auditoria" que verifica as guias TISS contra as regras específicas de cada operadora (unimed, amil, bradesco, etc.) *antes* da submissão do lote. Isso deve ser vendido não como uma *feature*, mas como "Seguro de Receita".9
3. **O "Portal dos Pais" 2.0 com IA Generativa:** Criar uma visão especificamente desenhada para os pais. Utilizar IA para traduzir os gráficos técnicos de evolução em resumos narrativos de progresso. Ex: "Hoje, a Maria conquistou X" em vez de "DTT Tentativa Set 4 completado com 80%". Isso ataca diretamente a causa raiz do churn familiar.47

### **7.2 Vendas e Operações: A Migração "Luvas Brancas" (White-Glove)**

1. **Migração como Serviço (Concierge):** Não peça aos clientes para importarem seus próprios dados. Venda um pacote de "Concierge de Migração". "Nós movemos seus dados, ou você não paga". Isso neutraliza a maior objeção de venda e o medo da perda de dados.54 Desenvolva scripts proprietários para extrair dados dos bancos de dados dos concorrentes principais.
2. **Calculadora de Custo de Turnover:** Construa uma ferramenta de vendas que calcula o custo do turnover para o gestor da clínica baseada nos dados dele. Mostre matematicamente como o KoraOS se paga apenas retendo terapeutas através de uma melhor UX e redução de carga administrativa.

### **7.3 Posicionamento de Marca: Empatia e Estabilidade**

1. **Calm Technology:** Posicione o KoraOS como a "Plataforma Silenciosa". Utilize paletas de cores suaves, designs de interação indulgentes (botões de desfazer, salvamento automático) e interfaces minimalistas para apelar aos usuários estressados.60
2. **O "Parceiro do Cuidado":** Mova-se além de ser um vendedor de software. Seja a plataforma que faz a ponte entre a clínica e a família, reduzindo o churn ao provar valor tangível.

## **Parte VIII: Análise Detalhada das Dores do Usuário (Modelo Iceberg Expandido)**

### **8.1 A Camada Financeira e Administrativa (Superfície)**

O sofrimento visível da gestão clínica é dominado pelo fenômeno da Glosa. No Brasil, a interseção da burocracia dos seguros privados (regulamentações da ANS) e a realidade clínica cria um ponto de fricção que sangra a receita.

A Mecânica da Perda de Receita:

Os dados sugerem que uma porcentagem significativa de glosas é evitável.

- **Erros de Codificação:** O uso de códigos TUSS ou CID-10 incorretos que não correspondem ao procedimento autorizado é uma fonte frequente de erro.4 O KoraOS deve ter um banco de dados de correlação TUSS x CID atualizado automaticamente.
- **Descasamento de Autorização:** Em ABA, onde os planos de tratamento duram meses, as autorizações frequentemente expiram no meio do tratamento. Se o software não sinalizar isso *antes* da sessão (bloqueando o check-in ou alertando a recepção), a clínica trabalha de graça.4
- **A Prática Ilegal da "Glosa Linear":** Operadoras frequentemente aplicam cortes lineares no faturamento como medida de economia de custos, apostando que as clínicas não terão recursos para contestar. Um sistema que automatiza a geração do "Recurso de Glosa" com base em modelos jurídicos pré-aprovados altera a dinâmica de poder.6

### **8.2 A Camada Clínica e Operacional (Submersa)**

**Burnout do Terapeuta - Os Dados:**

- **Carga de Casos:** Um terapeuta pode gerenciar de 5 a 10 casos, cada um exigindo registro diário de dados.
- **A Síndrome da "Noite de Domingo":** Relatórios são frequentemente devidos na segunda-feira. Terapeutas passam o fim de semana coligindo dados, destruindo seu equilíbrio entre vida pessoal e profissional.20
- **O Descasamento de Ferramentas:** Usar um ERP projetado para desktop na tela de um celular durante uma sessão no chão com uma criança autista é funcionalmente impossível. Isso força o fluxo de trabalho de "dupla entrada" (Papel -> Desktop).19

**Estresse da Secretaria - O Fator "WhatsApp":**

- **O Volume:** "Mensagens que desaparecem" ou "Retornos não respondidos" são citados como grandes estressores.30
- **A Solução:** Uma integração oficial com a API do WhatsApp que transforma conversas em "tickets" dentro da plataforma, visíveis para toda a equipe, remove o fardo do telefone de um indivíduo único e centraliza a comunicação no prontuário do paciente.35

### **8.3 As Barreiras à Mudança (A Âncora)**

Por que o *churn* de um *software ruim* para um *software bom* é tão lento?

- **Formatos Proprietários:** Sistemas legados muitas vezes "trancam" os dados em formatos proprietários difíceis de analisar propositalmente para evitar a saída do cliente.
- **O Viés de "Aversão à Perda":** Gestores temem o caos de curto prazo da mudança mais do que a dor de longo prazo da ineficiência.52
- **Privacidade de Dados (LGPD):** O medo de que a migração exponha dados sensíveis de pacientes a vazamentos ou violações da LGPD é uma barreira real.66 O KoraOS deve apresentar certificações de segurança robustas e contratos claros de processamento de dados.

## **Conclusão Final**

O mercado brasileiro de ABA está amadurecendo. A fase de "corrida do ouro" de abertura de clínicas está transicionando para uma fase de "eficiência", onde apenas clínicas operacionalmente sólidas sobreviverão à pressão das seguradoras (glosas) e às demandas das famílias (qualidade).

O KoraOS está posicionado para resolver a **tríade de fricção**:

1. **Fricção Financeira:** Através da auditoria automatizada de glosas.
2. **Fricção Clínica:** Através da coleta de dados *mobile-first* e *offline* que economiza o tempo do terapeuta e reduz o burnout.
3. **Fricção Familiar:** Através de relatórios inteligíveis aprimorados por IA que provam valor e reduzem o churn.

Ao abordar a porção submersa do iceberg — o burnout, a carga cognitiva e a ansiedade dos dados — o KoraOS pode transcender o status de commodity de "software de gestão" e tornar-se o sistema operacional essencial para o cuidado neurodesenvolvimental de alta performance no Brasil.

### **Tabelas de Dados e Evidências de Suporte**

### **Tabela 1: O Custo da Ineficiência em Clínicas de ABA**

| **Ponto de Dor** | **Stakeholder Principal** | **Impacto Financeiro** | **Impacto Operacional** |
| --- | --- | --- | --- |
| **Glosas Médicas** | Gestor / Proprietário | Perda de 5-15% da receita bruta; Atrasos no fluxo de caixa.3 | Necessidade de equipe dedicada de faturamento; Altos custos jurídicos. |
| **Dupla Entrada de Dados** | Terapeuta / Supervisor | Horas extras não pagas; Custo de *turnover* (recrutamento/treinamento).17 | Queda na qualidade do cuidado; Burnout; Capacidade de faturamento reduzida. |
| **No-Show (Faltas)** | Secretária / Recepção | Perda direta de receita (horas vagas); Agendas interrompidas.7 | Alto estresse; Conflito com famílias; Agendamento "Tetris". |
| **Relatórios Complexos** | Família / Clientes | Alta Taxa de Churn (queda no LTV); Risco de litígio.38 | Dano à marca; necessidade constante de adquirir novos pacientes (CAC alto). |

### **Tabela 2: Comparativo de Necessidades de Funcionalidade para Software ABA "Calmo"**

| **Funcionalidade** | **ERP Padrão (Médico)** | **Requisito para ABA (KoraOS)** | **O "Porquê" (O Insight)** |
| --- | --- | --- | --- |
| **Agendamento** | Baseado em Slots (15/30 min) | Baseado em Blocos (2-4 horas) com Regras de Recorrência | ABA é intensivo e repetitivo; calendários padrão falham em lidar com horários recorrentes de 40h/semana. |
| **Prontuário Clínico** | Baseado em Texto (Anamnese) | Baseado em Dados (Tentativas Discretas, Frequência, Intervalo) | ABA é quantitativo. Campos de texto são inúteis para rastrear tendências comportamentais precisas.19 |
| **Faturamento** | Por Consulta | Por Procedimento/Guia (TISS) com Tetos | Seguradoras impõem regras complexas sobre "horas por semana" e "tetos de sessão" que precisam de rastreamento automático.67 |
| **Relatórios** | Carta Médica / Receita | Gráficos Visuais (Linhas de Tendência) + Narrativa | Pais precisam ver a *curva* de melhoria para justificar o investimento emocional e financeiro.39 |

*Relatório compilado por Pesquisador Sênior de UX e Estrategista de Operações Clínicas para KoraOS. Janeiro de 2026.*