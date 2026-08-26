# Café com Deus Shine — Arquitetura Técnica

Versão 2 · Baseado na especificação MVP + referência de `consolidacao-deploy-v215` e `gcmanagerdist`.
Alterações da v2: algoritmo de distribuição completo (5 critérios, decisão do usuário — reverte
a recomendação de simplificação da v1), e módulo de LGPD (consentimento + anonimização).

---

## 0. Premissas assumidas (confirmar antes da Fase 1)

| Premissa | Confiança | Impacto se estiver errada |
|---|---|---|
| Single-tenant (uma comunidade só, sem isolamento multi-igreja) | Chutando | Reescreve schema inteiro (precisaria `organization_id` em toda tabela) |
| Stack: Next.js (App Router) + TypeScript + Supabase (Postgres/Auth/Storage) | Certo (confirmado por você) | — |
| Deploy: Vercel ou Netlify + Supabase Cloud | Provável | Baixo, só muda pipeline de deploy |
| Não haverá múltiplos administradores com hierarquia distinta no MVP (todo admin tem os mesmos poderes) | Chutando | Precisaria de `admin_level` ou role granular |
| Algoritmo de distribuição = score ponderado com pesos decrescentes (não prioridade lexicográfica estrita) | Provável — decisão minha, confirmar | Se você queria lexicográfico estrito, a lógica de scoring muda, não só o peso |
| "Exclusão de dados" = anonimização (preserva linha e histórico agregado, remove PII) | Provável — decisão minha, confirmar | Se você queria exclusão física real, quebra FKs de `attendance`/`follow_ups`/`meetings` e o item 34 da especificação original |

---

## 1. Stack

- **Frontend:** Next.js 14+ (App Router), TypeScript, Tailwind CSS
- **Backend/dados:** Supabase (Postgres + Auth + Row Level Security + Storage para fotos)
- **Gráficos:** Chart.js ou Recharts (dashboard)
- **Mapas/geolocalização (fase futura):** Leaflet — mesmo padrão usado no `consolidacao`, mas fora do MVP conforme item 29 da spec
- **Validação:** Zod (schema compartilhado client/server)
- **Estado servidor:** Server Components + Server Actions do Next.js — evita duplicar lógica de acesso a dados no cliente (exigência do item 30 da spec)

**Por que não seguir o padrão do `consolidacao` (HTML único + Supabase-JS direto no cliente):** funciona, está em produção, mas mistura UI/regra de negócio/acesso a dados no mesmo arquivo — exatamente o que a spec pede pra evitar (item 30). Reaproveito o *modelo de dados e a lógica* dele (nomes de tabela, regra de rotação de distribuição, cálculo de ausência consecutiva), não a estrutura de código.

---

## 2. Estrutura de pastas (alto nível)

```
/app
  /(auth)/login
  /(admin)
    /dashboard
    /participantes/[id]
    /liderancas
    /grupos
    /encontros
    /acompanhamentos
    /relatorios        (fase futura)
    /configuracoes
  /(lider)
    /inicio
    /minhas-participantes/[id]
    /encontros
    /acompanhamentos
    /historico
/components
  /participantes  (ParticipantCard, ParticipantForm, Timeline)
  /liderancas
  /grupos
  /encontros
  /acompanhamento (FollowUpForm, AttentionBadge)
  /dashboard      (StatCard, ChartWrapper)
  /ui             (base: Button, Card, Badge, DataTable, Modal)
/lib
  /supabase       (client.ts, server.ts, middleware.ts)
  /services       (participants.service.ts, distribution.service.ts, followups.service.ts...)
  /validators     (zod schemas)
/types
```

Regra: **nenhum componente de página fala com o Supabase diretamente.** Toda leitura/escrita passa por `/lib/services`. Isso é o que evita o problema estrutural do `consolidacao`.

---

## 3. Modelo de dados

### Enums

```sql
create type user_role as enum ('admin', 'lider', 'participante');
create type participant_status as enum (
  'nova_inscricao', 'aguardando_distribuicao', 'distribuida',
  'ativa', 'acompanhamento', 'inativa'
);
create type leader_status as enum ('ativa', 'inativa');
create type group_status as enum ('ativo', 'inativo', 'lotado');
create type meeting_status as enum ('planejado', 'confirmado', 'realizado', 'cancelado');
create type attendance_status as enum ('presente', 'ausente', 'justificou', 'nao_informado');
create type follow_up_type as enum ('encontro', 'ligacao', 'whatsapp', 'visita', 'oracao', 'acompanhamento_pastoral', 'outro');
create type follow_up_status as enum ('normal', 'atencao', 'acompanhamento_necessario');
```

### Tabelas principais

```sql
-- Autenticação: auth.users (nativo do Supabase)

create table profiles (
  id uuid primary key references auth.users(id),
  role user_role not null,
  full_name text not null,
  phone text,
  whatsapp text,
  email text,
  avatar_url text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table leaders (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id),
  city text,
  neighborhood text,
  meeting_address text,
  region text,
  availability jsonb,           -- dias/períodos
  max_capacity int not null default 12,
  status leader_status not null default 'ativa',
  joined_at date not null default current_date,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  leader_id uuid not null references leaders(id),
  address text,
  capacity int not null,
  region text,
  available_days text[],
  meeting_time time,
  status group_status not null default 'ativo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table participants (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id),        -- nulo até ela ter login (fase futura)
  full_name text not null,
  preferred_name text,
  phone text,
  whatsapp text,
  email text,
  birth_date date,
  city text,
  neighborhood text,
  address text,
  geo_lat numeric,
  geo_lng numeric,
  availability_days text[],
  availability_period text[],
  location_preference text,
  home_meeting_ok boolean default true,
  other_notes text,
  status participant_status not null default 'nova_inscricao',
  current_leader_id uuid references leaders(id),
  current_group_id uuid references groups(id),
  enrollment_date date not null default current_date,
  enrollment_source text,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,                            -- soft delete
  -- LGPD
  consent_accepted_at timestamptz,                  -- quando o consentimento foi obtido
  consent_version text,                             -- versão dos termos aceita (ver app_terms_versions)
  consent_method text,                               -- 'formulario_presencial' | 'autocadastro' | 'termo_assinado'
  anonymized_at timestamptz                          -- preenchido quando exclusão/anonimização é executada
);
-- Regra de negócio (aplicada na service layer, não só no banco):
-- não é permitido criar um participante sem consent_accepted_at preenchido.

create table participant_leader_history (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references participants(id),
  leader_id uuid not null references leaders(id),
  group_id uuid references groups(id),
  start_date date not null default current_date,
  end_date date,                                     -- nulo = vínculo atual
  reason text,
  changed_by uuid references profiles(id),
  created_at timestamptz not null default now()
);
-- garante que só existe 1 vínculo aberto (end_date null) por participante
create unique index one_open_assignment on participant_leader_history (participant_id)
  where end_date is null;

create table participant_status_history (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references participants(id),
  status participant_status not null,
  changed_by uuid references profiles(id),
  note text,
  created_at timestamptz not null default now()
);

create table meetings (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id),
  leader_id uuid not null references leaders(id),
  title text not null,
  date date not null,
  time time,
  location text,
  status meeting_status not null default 'planejado',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table meeting_participants (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references meetings(id),
  participant_id uuid not null references participants(id),
  created_at timestamptz not null default now(),
  unique (meeting_id, participant_id)
);

create table attendance (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references meetings(id),
  participant_id uuid not null references participants(id),
  status attendance_status not null default 'nao_informado',
  registered_by uuid references profiles(id),
  registered_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  unique (meeting_id, participant_id)          -- impede registro duplicado (item 10 da spec)
);

create table follow_ups (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references participants(id),
  leader_id uuid not null references leaders(id),
  date date not null default current_date,
  type follow_up_type not null,
  status follow_up_status not null default 'normal',
  observation text,
  needs_return boolean default false,
  next_follow_up_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id),
  type text not null,
  title text not null,
  body text,
  metadata jsonb,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_profile_id uuid references profiles(id),
  action text not null,             -- ex: 'participant.transfer', 'attendance.update'
  entity text not null,             -- ex: 'participants'
  entity_id uuid,
  before jsonb,
  after jsonb,
  created_at timestamptz not null default now()
);

create table app_config (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- LGPD

create table app_terms_versions (
  id uuid primary key default gen_random_uuid(),
  version text not null unique,
  content text not null,
  published_at timestamptz not null default now()
);

create table data_erasure_requests (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references participants(id),
  requested_by uuid references profiles(id),
  reason text,
  status text not null default 'pendente',   -- pendente | concluida | negada
  requested_at timestamptz not null default now(),
  processed_at timestamptz,
  processed_by uuid references profiles(id)
);
```

**Importante sobre o registro de anonimização em `audit_log`:** quando a anonimização for
executada, a entrada em `audit_log` (`action = 'participant.anonymize'`) deve guardar em
`before`/`after` apenas metadados (quais campos foram limpos, quando, por quem) — **nunca**
o valor original de nome/telefone/e-mail. Guardar o PII completo no log de auditoria
recriaria o mesmo problema que a anonimização tenta resolver.

**Índices recomendados (item 23 da spec):**
```sql
create index idx_participants_status on participants(status) where deleted_at is null;
create index idx_participants_leader on participants(current_leader_id);
create index idx_attendance_participant on attendance(participant_id);
create index idx_followups_participant on follow_ups(participant_id);
create index idx_followups_status on follow_ups(status);
create index idx_meetings_group_date on meetings(group_id, date);
```

---

## 4. Permissões (RLS no Postgres, não só na tela)

A spec (item 24) exige isso explicitamente — implementado como RLS do Supabase, não como `if (role === 'admin')` no React.

| Tabela | Admin | Líder | Participante (futuro) |
|---|---|---|---|
| `participants` | CRUD total | SELECT/UPDATE apenas onde `current_leader_id` = sua liderança **OU** existe registro em `participant_leader_history` com `leader_id` dela (acesso a histórico de quem já foi dela) | SELECT do próprio registro (`profile_id` = auth.uid()) |
| `leaders` | CRUD total | SELECT do próprio registro | sem acesso |
| `groups` | CRUD total | SELECT/UPDATE do(s) próprio(s) grupo(s) | SELECT do grupo atual |
| `meetings` | CRUD total | CRUD dos encontros do próprio grupo | SELECT dos encontros do seu grupo |
| `attendance` | CRUD total | INSERT/UPDATE apenas para encontros do próprio grupo | sem escrita |
| `follow_ups` | CRUD total | CRUD apenas de participantes sob sua responsabilidade (atual ou histórica) | sem acesso (dado sensível — pastoral) |
| `participant_leader_history` | CRUD total | SELECT apenas | sem acesso |
| `audit_log` | SELECT total | sem acesso | sem acesso |
| `data_erasure_requests` | CRUD total | INSERT apenas (pode solicitar exclusão de suas participantes, não processa) | sem acesso |
| `app_terms_versions` | CRUD total | SELECT apenas | SELECT apenas (fase futura) |

Participante anonimizada (`anonymized_at` preenchido) continua aparecendo em listagens e
contagens do dashboard — o registro não é ocultado, só os campos de PII vêm nulos/mascarados
na UI (ex.: nome exibido como "Participante removida (LGPD)"). Isso preserva os números do
dashboard (item 15 da especificação original) sem manter dado pessoal identificável.

Ponto de atenção real (item 5 + item 11 da spec): `follow_ups` guarda observação pastoral — dado sensível pela LGPD (convicção religiosa/saúde emocional). RLS de líder deve restringir por vínculo, e o campo `observation` provavelmente precisa de uma segunda camada de restrição por tipo (ex: `acompanhamento_pastoral` visível só a quem registrou + admin), não só por participante. Isso não está resolvido no schema acima — decidir na Fase 7.

---

## 5. Lógica de negócio central (services)

### `distribution.service.ts` — motor de sugestão completo (5 critérios)

Decisão revertida em relação à v1 deste documento (a pedido do usuário): implementar os 5
critérios do item 7 da especificação original, não a versão reduzida.

**Filtros obrigatórios (elimina candidato, não é score):**
- `leaders.status = 'ativa'`
- vagas restantes da líder > 0 (contagem de `participants.current_leader_id` < `leaders.max_capacity`)
- se atribuição for por grupo: `groups.status = 'ativo'`

**Score ponderado (0–100), pesos configuráveis em `app_config` sob a chave `distribution_weights`,
valor padrão:**

| Critério | Peso padrão | Cálculo |
|---|---|---|
| 1. Disponibilidade compatível | 40 | % de sobreposição entre `participants.availability_days/availability_period` e `groups.available_days`/horário |
| 2. Proximidade geográfica | 25 | Se `geo_lat/geo_lng` preenchidos em ambos: distância haversine normalizada inversamente (mais perto = maior score). Sem geo: comparação textual de `city`/`neighborhood` (mesmo bairro = 1, mesma cidade = 0.5, diferente = 0) |
| 3. Capacidade da líder | 15 | vagas_restantes / capacidade_máxima — favorece líder com mais espaço relativo, não só espaço absoluto |
| 4. Equilíbrio entre grupos | 10 | 1 − (participantes_atuais_do_grupo / média_de_participantes_por_grupo_ativo), limitado a [0,1] — favorece grupos abaixo da média |
| 5. Preferências cadastradas | 10 | Comparação textual entre `participants.location_preference` e `leaders.region`/`groups.region` |

**Decisão de design (minha, confirmar):** pesos decrescentes somados, não prioridade
lexicográfica estrita. Se o critério 1 (disponibilidade) tiver empate entre várias líderes,
os critérios seguintes desempatam pela ordem de peso — mas nenhum critério zera a
contribuição dos outros. Se a intenção real do "nesta ordem" da especificação original era
prioridade estrita (critério 1 decide sozinho na prática, os demais só quebram empate exato),
a fórmula muda de soma ponderada para comparação sequencial — são implementações diferentes,
não um ajuste de peso.

**Saída da função:** lista das 3 líderes elegíveis com maior score, ranqueadas, cada uma com
o detalhamento de pontuação por critério (para a administradora entender *por que* aquela
líder foi sugerida — sem isso a tela vira uma caixa preta). A administradora aceita uma das
3 ou escolhe manualmente outra líder fora da lista. A sugestão nunca grava no banco sozinha
(item 7 da especificação original).

### `consent.service.ts` — LGPD, consentimento

- `registerConsent(participantId, version, method)`: grava `consent_accepted_at`,
  `consent_version`, `consent_method`. Chamado obrigatoriamente no fluxo de criação de
  participante — a criação falha (validação, não constraint de banco) se não houver consentimento.
- Versão vigente dos termos lida de `app_terms_versions` (permite atualizar o texto legal sem
  alterar código).

### `erasure.service.ts` — LGPD, exclusão/anonimização

- `requestErasure(participantId, requestedBy, reason)`: cria linha em `data_erasure_requests`
  com status `pendente`. Qualquer admin pode solicitar; líder só solicita (não processa) — ver
  seção 4.
- `processErasure(requestId, processedBy)`: executa a anonimização de fato —
  1. Substitui `full_name`, `preferred_name`, `phone`, `whatsapp`, `email`, `birth_date`,
     `address`, `geo_lat`, `geo_lng`, `admin_notes` por `null` (ou placeholder no caso do nome).
  2. Substitui o texto de `follow_ups.observation` de todos os registros dessa participante
     por `'[removido a pedido do titular]'` — mantém `type`, `status`, `date` intactos (a
     jornada/estatística continua íntegra, o conteúdo sensível some).
  3. Seta `participants.anonymized_at = now()`.
  4. Atualiza `data_erasure_requests.status = 'concluida'`.
  5. Grava em `audit_log` **apenas metadados** da ação (ver nota na seção 3) — nunca o
     conteúdo original.
- Isto **não é** exclusão física de linha. Se no futuro houver exigência de apagar a linha
  de verdade, isso quebra as foreign keys de `attendance`/`meeting_participants`/`follow_ups`
  e o item 34 da especificação original ("nunca apagar histórico") — decisão que precisaria
  ser revisitada com você antes de implementar, não é uma troca de uma linha de código.

### `attendance.service.ts`
Grava presença, dispara recomputo de `follow_up_status` quando há 2+ faltas consecutivas
(regra do item 12).

### `followup.service.ts`
CRUD de acompanhamento + cálculo de "sem acompanhamento recente" (período configurável via
`app_config`).

### `transfer.service.ts`
Transferência de líder: fecha o registro aberto em `participant_leader_history` (seta
`end_date`), abre um novo, não toca em `meetings`/`follow_ups` antigos (item 14).

### `audit.service.ts`
Wrapper chamado por toda mutação administrativa relevante (item 25).

---

## 6. Fases (mantendo a ordem que você já definiu no item 38, com ajuste de escopo)

1. **Fundação** — projeto Next.js, Supabase, schema acima (incluindo tabelas de LGPD), Auth, RLS básico, layout + navegação por perfil.
2. **Participantes** — CRUD, listagem com filtros, perfil, timeline de jornada, captura de consentimento LGPD no cadastro, ação de solicitar exclusão/anonimização.
3. **Líderes e grupos** — CRUD, capacidade, disponibilidade.
4. **Distribuição** — motor de sugestão completo (5 critérios ponderados), histórico de vínculo.
5. **Encontros** — CRUD, calendário, vínculo com grupo.
6. **Presença** — chamada, constraint anti-duplicidade.
7. **Acompanhamento** — CRUD, alertas automáticos, decisão de privacidade por tipo de registro (ver seção 4).
8. **Dashboard** — indicadores admin + líder.

---

## 7. O que decidir antes de eu começar a Fase 1

1. Single-tenant confirmado? (assumido que sim)
2. A restrição de privacidade de `acompanhamento_pastoral` (seção 4) precisa de aprovação de escopo — é mais trabalho do que "CRUD simples".
3. Confirmar: score ponderado (minha decisão) vs. prioridade lexicográfica estrita para o algoritmo de distribuição (seção 5) — mudam o resultado prático das sugestões.
4. Confirmar: anonimização (minha decisão) vs. exclusão física real para "exclusão de dados" (seção 5) — exclusão física quebra histórico e FKs, exige redesenho.
5. Quem redige o texto legal dos termos LGPD que vai em `app_terms_versions`? Isso não é tarefa de engenharia — precisa de alguém responsável juridicamente pelo conteúdo antes da Fase 2 rodar de verdade em produção com dados reais.
