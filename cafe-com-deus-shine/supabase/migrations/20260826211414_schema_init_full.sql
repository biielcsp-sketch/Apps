-- Café com Deus Shine — schema inicial (seção 3 da arquitetura técnica)
create extension if not exists pgcrypto;

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
  availability jsonb,
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
  profile_id uuid references profiles(id),
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
  deleted_at timestamptz,
  -- LGPD
  consent_accepted_at timestamptz,
  consent_version text,
  consent_method text,
  anonymized_at timestamptz
);

create table participant_leader_history (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references participants(id),
  leader_id uuid not null references leaders(id),
  group_id uuid references groups(id),
  start_date date not null default current_date,
  end_date date,
  reason text,
  changed_by uuid references profiles(id),
  created_at timestamptz not null default now()
);
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
  unique (meeting_id, participant_id)
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
  action text not null,
  entity text not null,
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
  status text not null default 'pendente',
  requested_at timestamptz not null default now(),
  processed_at timestamptz,
  processed_by uuid references profiles(id)
);

-- Índices recomendados (item 23 da spec)
create index idx_participants_status on participants(status) where deleted_at is null;
create index idx_participants_leader on participants(current_leader_id);
create index idx_attendance_participant on attendance(participant_id);
create index idx_followups_participant on follow_ups(participant_id);
create index idx_followups_status on follow_ups(status);
create index idx_meetings_group_date on meetings(group_id, date);
create index idx_plh_participant on participant_leader_history(participant_id);
create index idx_plh_leader on participant_leader_history(leader_id);
create index idx_notifications_profile on notifications(profile_id) where read is false;
