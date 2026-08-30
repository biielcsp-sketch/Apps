create type auth_audit_event as enum (
  'login_success', 'login_failed', 'logout', 'password_reset_requested', 'access_denied'
);

create table auth_audit_log (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete set null,
  event auth_audit_event not null,
  ip_address text,
  user_agent text,
  metadata jsonb,
  created_at timestamptz not null default now()
);
create index auth_audit_log_created_at_idx on auth_audit_log (created_at desc);
create index auth_audit_log_profile_id_idx on auth_audit_log (profile_id);

alter table auth_audit_log enable row level security;

-- SELECT: só admin/desenvolvedor (app_is_admin() já cobre os dois, ver
-- migration developer_role_grants.sql). Sem policy de INSERT/UPDATE/DELETE
-- para ninguém — só a função abaixo (SECURITY DEFINER) escreve.
create policy "auth_audit_log_admin_select" on auth_audit_log for select to authenticated
  using (app_is_admin());

-- Precisa ser chamável por `anon`: login_failed e access_denied em RLS de
-- escrita podem acontecer antes de qualquer sessão existir. Só escreve
-- (retorna void) — não vaza nenhum dado de volta ao caller.
create or replace function app_log_auth_event(
  p_profile_id uuid,
  p_event auth_audit_event,
  p_ip_address text,
  p_user_agent text,
  p_metadata jsonb default null
)
returns void
language sql security definer set search_path = public
as $$
  insert into auth_audit_log (profile_id, event, ip_address, user_agent, metadata)
  values (p_profile_id, p_event, p_ip_address, p_user_agent, p_metadata);
$$;
revoke all on function app_log_auth_event(uuid, auth_audit_event, text, text, jsonb) from public;
grant execute on function app_log_auth_event(uuid, auth_audit_event, text, text, jsonb) to anon, authenticated;
