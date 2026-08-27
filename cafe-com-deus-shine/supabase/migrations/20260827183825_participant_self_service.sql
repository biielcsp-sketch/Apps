-- Acesso próprio da participante (login + autoatendimento restrito).

-- ── Helper: participante atual ──────────────────────────────────────────
create or replace function app_current_participant_id()
returns uuid
language sql stable security definer set search_path = public
as $$
  select id from participants where profile_id = auth.uid() limit 1;
$$;

grant execute on function app_current_participant_id() to authenticated;

-- ── participants: a própria participante pode ver e atualizar seus dados ──
create policy "participants_select_own" on participants for select to authenticated
  using (profile_id = auth.uid());
create policy "participants_update_own" on participants for update to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- Restringe quais colunas a própria participante pode alterar. A checagem
-- de papel no frontend é só UX (mostra só os campos permitidos no
-- formulário) — a barreira real é este trigger, que vale para qualquer
-- caminho de escrita (inclusive chamadas diretas à API REST).
create or replace function app_guard_participant_self_update()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if exists (select 1 from profiles where id = auth.uid() and role = 'participante') then
    if new.full_name is distinct from old.full_name
      or new.preferred_name is distinct from old.preferred_name
      or new.email is distinct from old.email
      or new.birth_date is distinct from old.birth_date
      or new.city is distinct from old.city
      or new.neighborhood is distinct from old.neighborhood
      or new.geo_lat is distinct from old.geo_lat
      or new.geo_lng is distinct from old.geo_lng
      or new.other_notes is distinct from old.other_notes
      or new.status is distinct from old.status
      or new.current_leader_id is distinct from old.current_leader_id
      or new.current_group_id is distinct from old.current_group_id
      or new.enrollment_date is distinct from old.enrollment_date
      or new.enrollment_source is distinct from old.enrollment_source
      or new.admin_notes is distinct from old.admin_notes
      or new.deleted_at is distinct from old.deleted_at
      or new.consent_accepted_at is distinct from old.consent_accepted_at
      or new.consent_version is distinct from old.consent_version
      or new.consent_method is distinct from old.consent_method
      or new.anonymized_at is distinct from old.anonymized_at
      or new.profile_id is distinct from old.profile_id
    then
      raise exception 'Participante só pode atualizar telefone, whatsapp, endereço e disponibilidade.';
    end if;
  end if;
  return new;
end;
$$;

create trigger guard_participant_self_update
  before update on participants
  for each row execute function app_guard_participant_self_update();

-- ── leaders: participante vê a própria líder responsável ─────────────────
create policy "leaders_participant_select" on leaders for select to authenticated
  using (id = (select current_leader_id from participants where id = app_current_participant_id()));

-- ── profiles: participante vê o perfil (nome/telefone) da própria líder ──
create policy "profiles_participant_view_leader" on profiles for select to authenticated
  using (
    id = (
      select l.profile_id from leaders l
      join participants p on p.current_leader_id = l.id
      where p.id = app_current_participant_id()
    )
  );

-- ── groups: participante vê o próprio grupo ───────────────────────────────
create policy "groups_participant_select" on groups for select to authenticated
  using (id = (select current_group_id from participants where id = app_current_participant_id()));

-- ── meetings: participante vê os encontros do próprio grupo ──────────────
create policy "meetings_participant_select" on meetings for select to authenticated
  using (
    exists (
      select 1 from participants p
      where p.id = app_current_participant_id() and p.current_group_id = meetings.group_id
    )
  );

-- ── attendance: participante confirma a própria presença ────────────────
-- Só pode marcar 'presente' (autoconfirmação) — a chamada oficial
-- (incluindo ausência/justificativa) continua exclusiva da líder.
create policy "attendance_participant_select" on attendance for select to authenticated
  using (participant_id = app_current_participant_id());

create policy "attendance_participant_insert" on attendance for insert to authenticated
  with check (
    participant_id = app_current_participant_id()
    and status = 'presente'
    and exists (
      select 1 from meetings m
      join participants p on p.current_group_id = m.group_id
      where m.id = attendance.meeting_id and p.id = app_current_participant_id()
    )
  );

create policy "attendance_participant_update" on attendance for update to authenticated
  using (participant_id = app_current_participant_id())
  with check (
    participant_id = app_current_participant_id()
    and status = 'presente'
    and exists (
      select 1 from meetings m
      join participants p on p.current_group_id = m.group_id
      where m.id = attendance.meeting_id and p.id = app_current_participant_id()
    )
  );

-- ── participant_leader_history / participant_status_history: jornada própria ──
create policy "plh_participant_select" on participant_leader_history for select to authenticated
  using (participant_id = app_current_participant_id());
create policy "psh_participant_select" on participant_status_history for select to authenticated
  using (participant_id = app_current_participant_id());
