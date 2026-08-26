# Café com Deus Shine
## Documento de Especificação do Sistema — MVP

---

## 1. Visão do Produto

O **Café com Deus Shine** é uma plataforma de gestão e acompanhamento de mulheres participantes de uma jornada de encontros cristãos.

O sistema não deve ser tratado apenas como um sistema de cadastro ou controle de presença.

O objetivo principal é permitir que a equipe responsável consiga:

- cadastrar participantes;
- organizar participantes por líderes;
- distribuir participantes considerando localização e disponibilidade;
- organizar encontros nas casas das líderes;
- controlar presença;
- registrar acompanhamentos;
- manter um histórico de longo prazo de cada participante;
- identificar mulheres que precisam de atenção;
- acompanhar indicadores gerais do projeto.

A ideia central do produto é:

> "Não é apenas saber quem participou do Café com Deus. É saber quem está caminhando conosco e cuidar para que ninguém caminhe sozinha."

O sistema deve ser preparado para crescer futuramente sem necessidade de reconstrução da arquitetura.

---

## 2. Perfis de Usuário

O sistema terá inicialmente três perfis.

### 2.1 Administradora

Possui acesso completo ao sistema.

Pode:

- cadastrar, editar e inativar líderes;
- cadastrar e editar participantes;
- visualizar todas as participantes;
- visualizar todas as líderes;
- criar e gerenciar encontros;
- distribuir participantes entre líderes;
- alterar a líder responsável por uma participante;
- visualizar histórico;
- visualizar acompanhamentos;
- visualizar indicadores;
- gerenciar configurações gerais.

### 2.2 Líder

A líder possui acesso somente às informações necessárias para cuidar das participantes sob sua responsabilidade.

Pode:

- visualizar suas participantes;
- visualizar informações básicas das participantes;
- visualizar seus próximos encontros;
- registrar presença;
- registrar ausência;
- registrar observações;
- registrar acompanhamento;
- identificar participantes que precisam de atenção;
- consultar histórico das participantes que estão ou estiveram sob sua responsabilidade, respeitando as regras de privacidade.

Não pode:

- visualizar participantes de outras líderes sem autorização;
- alterar dados administrativos;
- alterar a distribuição global;
- gerenciar outras líderes;
- acessar indicadores administrativos sensíveis.

### 2.3 Participante

A participante poderá futuramente possuir acesso próprio. No MVP, a estrutura deve estar preparada para isso, mesmo que o acesso ainda não seja implementado.

Futuramente poderá:

- visualizar seus dados;
- visualizar sua líder;
- visualizar seus encontros;
- confirmar presença;
- visualizar sua jornada;
- receber comunicados;
- atualizar informações autorizadas.

---

## 3. Jornada da Participante

A participante deve possuir uma jornada independente dos encontros.

Estados possíveis:

```
NOVA INSCRIÇÃO
      ↓
AGUARDANDO DISTRIBUIÇÃO
      ↓
DISTRIBUÍDA
      ↓
ATIVA
      ↓
ACOMPANHAMENTO
      ↓
INATIVA
```

A participante pode retornar ao status ATIVA posteriormente.

A distribuição para uma líder não deve apagar o histórico anterior.

---

## 4. Cadastro da Participante

**Informações pessoais**

- nome completo;
- nome pelo qual prefere ser chamada;
- telefone;
- WhatsApp;
- e-mail;
- data de nascimento, se necessário;
- cidade;
- bairro;
- endereço, se necessário e permitido;
- localização/geolocalização, quando disponível.

**Informações de disponibilidade**

- dias disponíveis;
- períodos disponíveis;
- preferência de localização;
- disponibilidade para encontros em casa;
- outras informações relevantes.

**Informações da jornada**

- data da inscrição;
- origem da inscrição;
- status;
- líder atual;
- grupo/encontro atual;
- observações administrativas.

---

## 5. Privacidade

- Dados pessoais devem ser tratados como informações privadas.
- Aplicar princípio de menor privilégio.
- A líder deve visualizar somente os dados necessários para realizar seu papel de acompanhamento.
- Evitar exibir informações sensíveis desnecessárias.
- Observações de acompanhamento devem possuir controle de acesso.
- O sistema deve ser desenvolvido considerando boas práticas de privacidade e LGPD.

---

## 6. Cadastro de Líderes

Cada líder deve possuir:

- nome;
- telefone;
- WhatsApp;
- e-mail;
- cidade;
- bairro;
- endereço do local do encontro, quando aplicável;
- região de atuação;
- disponibilidade;
- capacidade máxima de participantes;
- status;
- data de entrada;
- observações administrativas.

**Status:** ativa; inativa.

Uma líder inativa não deve receber novas participantes.

---

## 7. Distribuição das Participantes

A distribuição é uma função administrativa.

O sistema deve permitir que a administradora:

1. visualize participantes aguardando distribuição;
2. visualize líderes disponíveis;
3. visualize capacidade de cada líder;
4. visualize localização;
5. visualize disponibilidade;
6. receba sugestões de distribuição;
7. aceite ou altere manualmente a sugestão;
8. confirme a distribuição.

**Critérios de sugestão** (nesta ordem):

1. compatibilidade de disponibilidade;
2. proximidade geográfica;
3. capacidade da líder;
4. equilíbrio entre grupos;
5. preferências cadastradas.

A sugestão automática nunca deve alterar a distribuição sem confirmação da administradora.

---

## 8. Grupos / Casas

Uma líder pode possuir um grupo/encontro associado.

O sistema deve permitir:

- nome do grupo;
- líder responsável;
- endereço;
- capacidade;
- região;
- dias disponíveis;
- horário;
- status.

**Exemplo:**

```
Casa da Ana
Líder: Ana
Região: Barueri
Capacidade: 12
Dia: sábado
Horário: 15:00
```

A arquitetura deve permitir futuramente que uma líder tenha mais de um grupo ou que existam outros formatos de encontro.

---

## 9. Encontros

Um encontro deve possuir:

- título;
- data;
- horário;
- local;
- grupo;
- líder responsável;
- participantes vinculadas;
- status.

**Status:** planejado; confirmado; realizado; cancelado.

---

## 10. Presença

Cada participante deve possuir um registro de presença por encontro.

**Status:** presente; ausente; justificou; não informado.

A líder poderá registrar a presença após o encontro.

O sistema deve impedir registros duplicados para a mesma participante no mesmo encontro.

---

## 11. Acompanhamento

Esta é uma das funcionalidades mais importantes do sistema.

Após cada encontro, a líder poderá registrar um acompanhamento.

**Campos:**

- participante;
- líder;
- data;
- tipo;
- status;
- observação;
- necessidade de retorno;
- data do próximo acompanhamento.

**Tipos possíveis:** encontro; ligação; WhatsApp; visita; oração; acompanhamento pastoral; outro.

**Status:** normal; atenção; acompanhamento necessário.

---

## 12. Alertas de Acompanhamento

O sistema deve identificar situações que merecem atenção.

**Participante ausente**
Se uma participante faltar a um encontro, ela pode aparecer como "Precisa de contato".

**Ausências consecutivas**
Se houver duas ou mais ausências consecutivas: "Acompanhamento necessário".

**Sem acompanhamento recente**
Se uma participante estiver ativa e passar determinado período sem registro de acompanhamento: "Sem acompanhamento recente". O período deve ser configurável futuramente.

---

## 13. Histórico da Participante

Cada participante deve possuir uma página de histórico.

**Exemplo:**

```
MARIA SILVA
Status: ATIVA
Líder atual: ANA
Grupo: CASA DA ANA

JORNADA
10/08/2026 — Inscrição realizada
12/08/2026 — Distribuída para Ana
15/08/2026 — Primeiro encontro (Presente)
20/08/2026 — Acompanhamento (Status: Normal)
22/08/2026 — Contato via WhatsApp (Status: Atenção)

PRESENÇA
Agosto: ████████░░ 80%

ÚLTIMO ACOMPANHAMENTO
22/08/2026
```

O histórico nunca deve ser apagado simplesmente porque a participante mudou de líder.

---

## 14. Transferência de Participante

A administradora pode transferir uma participante para outra líder.

Ao realizar a transferência:

- manter líder anterior no histórico;
- registrar data da transferência;
- registrar nova líder;
- manter todos os encontros anteriores;
- manter todos os acompanhamentos;
- atualizar somente a responsabilidade atual.

**Exemplo:**

```
01/08 → Líder Ana
15/09 → Transferida para Líder Juliana
```

---

## 15. Dashboard Administrativo

**Indicadores**

- total de participantes;
- participantes ativas;
- aguardando distribuição;
- total de líderes ativas;
- encontros do período;
- presença média;
- participantes que precisam de acompanhamento.

**Visualizações**

- participantes por região;
- participantes por líder;
- distribuição por grupo;
- frequência;
- evolução de participantes;
- acompanhamentos pendentes.

O dashboard deve ser visualmente limpo e fácil de entender.

---

## 16. Dashboard da Líder

A líder deve encontrar rapidamente aquilo que precisa fazer.

**Exemplo:**

```
Olá, Ana 🌷
12 mulheres sob seu acompanhamento

┌──────────────────────┐
│ 8 presentes          │
│ 2 ausentes           │
│ 2 precisam contato   │
└──────────────────────┘

PRÓXIMO ENCONTRO
15/09/2026 — 15:00 — Casa da Ana
[Ver participantes]

ACOMPANHAMENTOS
2 mulheres precisam de atenção
[Ver acompanhamentos]
```

---

## 17. Lista de Participantes

**Filtros:** nome; líder; região; status; grupo; presença; necessidade de acompanhamento; data de inscrição.

Permitir busca rápida.

---

## 18. Perfil da Participante

A página deve conter:

- **Cabeçalho:** nome, foto (se disponível), status, líder atual, grupo atual.
- **Informações:** dados pessoais, localização, disponibilidade.
- **Jornada:** linha do tempo.
- **Presença:** histórico de encontros.
- **Acompanhamentos:** histórico de contatos.
- **Ações:** editar; transferir líder; registrar acompanhamento; registrar observação; alterar status.

---

## 19. Navegação

**Administradora**

- Dashboard
- Participantes
- Líderes
- Grupos
- Encontros
- Acompanhamentos
- Relatórios
- Configurações

**Líder**

- Início
- Minhas participantes
- Próximos encontros
- Acompanhamentos
- Histórico

---

## 20. Design

A identidade visual deve transmitir: feminino, acolhimento, comunhão, espiritualidade, elegância, simplicidade, cuidado.

Evitar aparência excessivamente infantil ou religiosa de maneira caricata.

Referência conceitual: **mesa + comunhão + cuidado + presença de Deus + feminilidade.**

A interface deve ser moderna, limpa e acolhedora, priorizando:

- boa tipografia;
- espaçamento;
- cards;
- indicadores claros;
- navegação simples;
- responsividade.

O sistema deve funcionar muito bem em celular, pois as líderes provavelmente utilizarão o sistema principalmente pelo smartphone.

---

## 21. Responsividade

Prioridade: **1. Mobile → 2. Tablet → 3. Desktop**

A interface não deve ser simplesmente uma versão reduzida do desktop. Criar uma experiência mobile-first.

---

## 22. Banco de Dados

Criar estrutura relacional preparada para crescimento.

**Entidades principais:**

- `users`
- `profiles`
- `leaders`
- `participants`
- `groups`
- `meetings`
- `meeting_participants`
- `attendance`
- `follow_ups`
- `participant_leader_history`
- `notifications`

**Relacionamentos**

- `users` — representa autenticação.
- `profiles` — informações gerais do usuário.
- `leaders` — dados específicos da líder.
- `participants` — dados específicos da participante.
- `groups` — grupos/casas.
- `meetings` — encontros.
- `meeting_participants` — relaciona participantes aos encontros.
- `attendance` — registra presença.
- `follow_ups` — registra acompanhamentos.
- `participant_leader_history` — registra alterações de liderança.
- `notifications` — estrutura para futuras notificações.

---

## 23. Regras Importantes do Banco

Usar: UUIDs; timestamps (`created_at`, `updated_at`); soft delete quando necessário; foreign keys; índices para consultas frequentes; constraints para evitar duplicidade.

Não apagar dados históricos desnecessariamente.

---

## 24. Autenticação

Implementar autenticação segura. Perfis devem possuir permissões diferentes.

Nunca confiar somente na interface para controle de acesso — as regras de autorização devem existir também no backend/banco.

---

## 25. Auditoria

Preparar estrutura para registrar ações administrativas importantes, como:

- criação de participante;
- alteração de dados;
- transferência de líder;
- alteração de status;
- criação/cancelamento de encontro;
- alteração de presença.

Futuramente isso poderá ser usado para auditoria.

---

## 26. Notificações — Preparação

Não é obrigatório implementar todas no MVP, mas a arquitetura deve permitir futuramente:

- lembrete de encontro;
- nova participante atribuída à líder;
- lembrete de acompanhamento;
- participante ausente;
- acompanhamento pendente;
- comunicados administrativos.

---

## 27. Relatórios Futuros

Preparar arquitetura para:

- relatório de participantes;
- relatório de presença;
- relatório por líder;
- relatório por região;
- relatório de acompanhamento;
- evolução mensal;
- taxa de retenção;
- participantes inativas.

---

## 28. MVP — Priorização

**Autenticação:** login; controle de acesso.

**Administração:** dashboard; cadastro de líderes; cadastro de participantes; distribuição; grupos; encontros; presença; acompanhamentos.

**Líder:** dashboard; minhas participantes; encontros; presença; acompanhamento.

**Participante:** a estrutura deve existir no banco, mas o portal da participante pode ficar para uma segunda etapa.

---

## 29. Não Implementar Agora

Deixar para fases futuras:

- aplicativo nativo;
- chat interno;
- pagamentos;
- integração com WhatsApp;
- notificações push;
- geolocalização avançada;
- algoritmo complexo de distribuição;
- inteligência artificial;
- portal completo da participante.

A arquitetura deve permitir essas evoluções, mas o MVP deve permanecer simples.

---

## 30. Princípio de Desenvolvimento

- Não construir o sistema apenas com telas mockadas.
- Todas as funcionalidades principais devem estar conectadas ao banco de dados.
- Evitar dados hardcoded.
- Evitar duplicação de lógica.
- Criar componentes reutilizáveis.
- Criar serviços/repositórios para acesso aos dados quando fizer sentido.

Manter separação clara entre: UI; regras de negócio; acesso a dados; autenticação/autorização.

---

## 31. Experiência de Uso

Sempre priorizar a pergunta: **"O que a líder precisa fazer hoje?"**

A líder não deve precisar navegar por várias telas para descobrir quem precisa de contato, quem faltou, qual é o próximo encontro, e quais participantes estão sob sua responsabilidade. O sistema deve trazer essas informações para ela.

Para a administradora, priorizar: **"O que precisa da minha atenção?"**

Exemplos: participantes sem líder; grupos lotados; líderes inativas; encontros próximos; participantes que precisam de acompanhamento.

---

## 32. Fluxo Principal

```
PARTICIPANTE
    ↓
Cadastro
    ↓
Aguardando distribuição
    ↓
Administradora analisa
    ↓
Líder atribuída
    ↓
Grupo definido
    ↓
Encontro agendado
    ↓
Participante participa
    ↓
Presença registrada
    ↓
Líder registra acompanhamento
    ↓
Histórico atualizado
    ↓
Próximo encontro
    ↓
Novo acompanhamento
    ↓
JORNADA CONTÍNUA
```

---

## 33. Fluxo de Atenção

```
Participante falta
       ↓
Sistema identifica ausência
       ↓
Líder recebe indicação
       ↓
Líder realiza contato
       ↓
Registra acompanhamento
       ↓
Status atualizado
       ↓
Próximo acompanhamento
```

---

## 34. Princípio de Histórico

Nunca substituir informações históricas quando uma alteração representar uma mudança de estado.

**Não fazer:** `Líder = Juliana` (apagando a informação anterior).

**Fazer:**

```
Histórico:
01/08 → Ana
15/09 → Juliana
```

O sistema deve preservar a jornada.

---

## 35. Escalabilidade

Desenvolver considerando que futuramente poderá haver: centenas de participantes; dezenas de líderes; múltiplas cidades; múltiplas regiões; vários grupos; diferentes tipos de encontro; múltiplos administradores.

Não criar regras limitadas artificialmente ao tamanho atual.

---

## 36. Segurança

Implementar: autenticação; autorização por perfil; validação de dados; proteção de rotas; proteção de operações administrativas; controle de acesso aos dados; tratamento adequado de erros; não expor credenciais; variáveis de ambiente para secrets.

Nunca colocar secrets diretamente no código.

---

## 37. Instruções para a Implementação

Antes de começar a implementar:

1. Analise toda esta especificação.
2. Identifique possíveis inconsistências.
3. Proponha a arquitetura técnica.
4. Defina a estrutura do banco.
5. Defina os relacionamentos.
6. Defina as permissões.
7. Defina a estrutura de rotas.
8. Defina os componentes principais.
9. Só depois comece a implementação.

Não implemente tudo em uma única etapa. Divida em fases.

---

## 38. Fases de Desenvolvimento

**Fase 1 — Fundação:** projeto; autenticação; banco; perfis; permissões; layout; navegação.

**Fase 2 — Participantes:** cadastro; edição; listagem; filtros; perfil; histórico.

**Fase 3 — Líderes e grupos:** cadastro; edição; grupos; capacidade; disponibilidade.

**Fase 4 — Distribuição:** participantes aguardando distribuição; sugestão; distribuição manual; transferência; histórico.

**Fase 5 — Encontros:** criação; edição; calendário; participantes; status.

**Fase 6 — Presença:** chamada; presença; ausência; justificativa; histórico.

**Fase 7 — Acompanhamento:** registros; status; observações; pendências; histórico; alertas.

**Fase 8 — Dashboard:** indicadores; gráficos; pendências; visão administrativa.

---

## 39. Critérios de Aceitação

Uma funcionalidade só deve ser considerada concluída quando:

- estiver funcionando;
- estiver conectada ao banco;
- possuir validação;
- possuir tratamento de erros;
- respeitar permissões;
- funcionar no mobile;
- não quebrar funcionalidades existentes.

---

## 40. Regra Final para o Desenvolvimento

Não criar funcionalidades apenas porque parecem interessantes.

Toda funcionalidade deve responder a uma destas perguntas:

1. Isso ajuda a administrar o Café com Deus Shine?
2. Isso ajuda a líder a cuidar melhor das mulheres?
3. Isso ajuda a acompanhar a jornada da participante?
4. Isso melhora a organização dos encontros?
5. Isso gera informação útil para tomada de decisão?

Se a resposta for não, deixar fora do MVP. O produto deve permanecer simples, acolhedor, rápido e fácil de usar.

---

## Objetivo Final

Construir uma plataforma que permita à equipe do Café com Deus Shine sair de um modelo baseado em planilhas, listas e controles manuais para um modelo organizado de:

**INSCRIÇÃO → CONEXÃO → ENCONTRO → ACOMPANHAMENTO → CUIDADO → JORNADA DE LONGO PRAZO.**

A tecnologia deve servir ao propósito do ministério, e não o contrário.
