-- Nova trilha de acompanhamento (5 estágios), anfitriã do café com acesso
-- somente leitura, campo de quem ministrou a palavra, estudo do mês e as
-- regras do café. Conteúdo idêntico ao aplicado via apply_migration.

alter table participants alter column contact_status drop default;
alter table participants alter column contact_status type text;
alter table participant_contact_status_history alter column status type text;

drop type contact_status;
create type contact_status as enum (
  'em_processo', 'primeira_visita', 'segunda_visita', 'terceira_visita', 'membro'
);

alter table participants
  alter column contact_status type contact_status using 'em_processo'::contact_status;
alter table participants alter column contact_status set default 'em_processo';
alter table participant_contact_status_history
  alter column status type contact_status using 'em_processo'::contact_status;

alter table groups add column if not exists host_profile_id uuid references profiles(id);

create or replace function public.app_hosted_group_id()
returns uuid language sql stable security definer set search_path to 'public'
as $$ select id from groups where host_profile_id = auth.uid() limit 1; $$;
revoke execute on function public.app_hosted_group_id() from public, anon;

create policy participants_host_select on participants
  for select using (current_group_id = app_hosted_group_id());
create policy groups_host_select on groups
  for select using (host_profile_id = auth.uid());
create policy meetings_host_select on meetings
  for select using (group_id = app_hosted_group_id());
create policy attendance_host_select on attendance
  for select using (
    exists (select 1 from meetings m
            where m.id = attendance.meeting_id and m.group_id = app_hosted_group_id())
  );

alter table meetings add column if not exists ministered_by text;

create table if not exists study_materials (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  reference_month date not null,
  storage_path text not null,
  file_name text not null,
  mime_type text not null,
  size_bytes integer not null,
  uploaded_by uuid references profiles(id),
  created_at timestamptz not null default now()
);
create index if not exists study_materials_month_idx on study_materials (reference_month desc);
alter table study_materials enable row level security;
create policy study_materials_select on study_materials for select to authenticated using (true);
create policy study_materials_admin_write on study_materials for all
  using (app_is_admin()) with check (app_is_admin());

insert into app_config (key, value) values ('cafe_rules', '{"text": ""}'::jsonb)
on conflict (key) do nothing;
