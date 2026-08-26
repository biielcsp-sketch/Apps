-- Café com Deus Shine — RLS (seção 4 da arquitetura técnica)

-- ── Funções auxiliares (SECURITY DEFINER, evitam recursão de RLS) ──────────

create or replace function app_is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function app_current_leader_id()
returns uuid
language sql stable security definer set search_path = public
as $$
  select id from leaders where profile_id = auth.uid() limit 1;
$$;

-- líder é responsável (atual OU histórica) pela participante
create or replace function app_is_responsible_for_participant(p_participant_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from participants p
    where p.id = p_participant_id
      and (
        p.current_leader_id = app_current_leader_id()
        or exists (
          select 1 from participant_leader_history plh
          where plh.participant_id = p.id and plh.leader_id = app_current_leader_id()
        )
      )
  );
$$;

-- único caminho de escrita em audit_log — a tabela em si não aceita INSERT
-- direto de ninguém (nem admin), preservando a trilha de auditoria.
create or replace function app_log_audit_event(
  p_action text, p_entity text, p_entity_id uuid,
  p_before jsonb default null, p_after jsonb default null
)
returns void
language sql security definer set search_path = public
as $$
  insert into audit_log (actor_profile_id, action, entity, entity_id, before, after)
  values (auth.uid(), p_action, p_entity, p_entity_id, p_before, p_after);
$$;

grant execute on function app_is_admin() to authenticated;
grant execute on function app_current_leader_id() to authenticated;
grant execute on function app_is_responsible_for_participant(uuid) to authenticated;
grant execute on function app_log_audit_event(text, text, uuid, jsonb, jsonb) to authenticated;

-- ── profiles ─────────────────────────────────────────────────────────────
alter table profiles enable row level security;

create policy "profiles_select" on profiles for select to authenticated
  using (id = auth.uid() or app_is_admin());
create policy "profiles_update" on profiles for update to authenticated
  using (id = auth.uid() or app_is_admin())
  with check (id = auth.uid() or app_is_admin());
create policy "profiles_admin_insert" on profiles for insert to authenticated
  with check (app_is_admin());
create policy "profiles_admin_delete" on profiles for delete to authenticated
  using (app_is_admin());

-- ── leaders ──────────────────────────────────────────────────────────────
alter table leaders enable row level security;

create policy "leaders_select" on leaders for select to authenticated
  using (app_is_admin() or profile_id = auth.uid());
create policy "leaders_admin_write" on leaders for all to authenticated
  using (app_is_admin()) with check (app_is_admin());

-- ── groups ───────────────────────────────────────────────────────────────
alter table groups enable row level security;

create policy "groups_select" on groups for select to authenticated
  using (app_is_admin() or leader_id = app_current_leader_id());
create policy "groups_leader_update" on groups for update to authenticated
  using (app_is_admin() or leader_id = app_current_leader_id())
  with check (app_is_admin() or leader_id = app_current_leader_id());
create policy "groups_admin_insert" on groups for insert to authenticated
  with check (app_is_admin());
create policy "groups_admin_delete" on groups for delete to authenticated
  using (app_is_admin());

-- ── participants ─────────────────────────────────────────────────────────
alter table participants enable row level security;

create policy "participants_select" on participants for select to authenticated
  using (
    app_is_admin()
    or current_leader_id = app_current_leader_id()
    or exists (
      select 1 from participant_leader_history plh
      where plh.participant_id = participants.id and plh.leader_id = app_current_leader_id()
    )
  );
create policy "participants_update" on participants for update to authenticated
  using (
    app_is_admin()
    or current_leader_id = app_current_leader_id()
    or exists (
      select 1 from participant_leader_history plh
      where plh.participant_id = participants.id and plh.leader_id = app_current_leader_id()
    )
  )
  with check (
    app_is_admin()
    or current_leader_id = app_current_leader_id()
    or exists (
      select 1 from participant_leader_history plh
      where plh.participant_id = participants.id and plh.leader_id = app_current_leader_id()
    )
  );
create policy "participants_admin_insert" on participants for insert to authenticated
  with check (app_is_admin());
create policy "participants_admin_delete" on participants for delete to authenticated
  using (app_is_admin());

-- ── participant_leader_history ──────────────────────────────────────────
-- Nota: a matriz da seção 4 diz apenas "líder: SELECT apenas", sem escopo
-- explícito. Restringimos ao mesmo vínculo (atual/histórico) usado em
-- participants, por coerência com o princípio de menor privilégio (seção 5
-- da especificação) — do contrário a líder enxergaria vínculos de TODAS as
-- participantes do sistema, não só as dela. Vale confirmar com o usuário.
alter table participant_leader_history enable row level security;

create policy "plh_select" on participant_leader_history for select to authenticated
  using (app_is_admin() or app_is_responsible_for_participant(participant_id));
create policy "plh_admin_write" on participant_leader_history for all to authenticated
  using (app_is_admin()) with check (app_is_admin());

-- ── participant_status_history ─────────────────────────────────────────
-- Não está na matriz explícita da seção 4; tratada com a mesma regra de
-- vínculo de participants (necessária para a timeline de jornada da Fase 2).
alter table participant_status_history enable row level security;

create policy "psh_select" on participant_status_history for select to authenticated
  using (app_is_admin() or app_is_responsible_for_participant(participant_id));
create policy "psh_admin_write" on participant_status_history for all to authenticated
  using (app_is_admin()) with check (app_is_admin());

-- ── meetings ─────────────────────────────────────────────────────────────
alter table meetings enable row level security;

create policy "meetings_select" on meetings for select to authenticated
  using (app_is_admin() or leader_id = app_current_leader_id());
create policy "meetings_leader_insert" on meetings for insert to authenticated
  with check (app_is_admin() or leader_id = app_current_leader_id());
create policy "meetings_leader_update" on meetings for update to authenticated
  using (app_is_admin() or leader_id = app_current_leader_id())
  with check (app_is_admin() or leader_id = app_current_leader_id());
create policy "meetings_leader_delete" on meetings for delete to authenticated
  using (app_is_admin() or leader_id = app_current_leader_id());

-- ── meeting_participants ────────────────────────────────────────────────
-- Não está na matriz explícita; segue o mesmo dono (líder do encontro).
alter table meeting_participants enable row level security;

create policy "mp_select" on meeting_participants for select to authenticated
  using (
    app_is_admin()
    or exists (select 1 from meetings m where m.id = meeting_participants.meeting_id and m.leader_id = app_current_leader_id())
  );
create policy "mp_write" on meeting_participants for all to authenticated
  using (
    app_is_admin()
    or exists (select 1 from meetings m where m.id = meeting_participants.meeting_id and m.leader_id = app_current_leader_id())
  )
  with check (
    app_is_admin()
    or exists (select 1 from meetings m where m.id = meeting_participants.meeting_id and m.leader_id = app_current_leader_id())
  );

-- ── attendance ───────────────────────────────────────────────────────────
alter table attendance enable row level security;

create policy "attendance_select" on attendance for select to authenticated
  using (
    app_is_admin()
    or exists (select 1 from meetings m where m.id = attendance.meeting_id and m.leader_id = app_current_leader_id())
  );
create policy "attendance_leader_insert" on attendance for insert to authenticated
  with check (
    app_is_admin()
    or exists (select 1 from meetings m where m.id = attendance.meeting_id and m.leader_id = app_current_leader_id())
  );
create policy "attendance_leader_update" on attendance for update to authenticated
  using (
    app_is_admin()
    or exists (select 1 from meetings m where m.id = attendance.meeting_id and m.leader_id = app_current_leader_id())
  )
  with check (
    app_is_admin()
    or exists (select 1 from meetings m where m.id = attendance.meeting_id and m.leader_id = app_current_leader_id())
  );
create policy "attendance_admin_delete" on attendance for delete to authenticated
  using (app_is_admin());

-- ── follow_ups ───────────────────────────────────────────────────────────
alter table follow_ups enable row level security;

create policy "followups_select" on follow_ups for select to authenticated
  using (app_is_admin() or app_is_responsible_for_participant(participant_id));
create policy "followups_leader_insert" on follow_ups for insert to authenticated
  with check (app_is_admin() or app_is_responsible_for_participant(participant_id));
create policy "followups_leader_update" on follow_ups for update to authenticated
  using (app_is_admin() or app_is_responsible_for_participant(participant_id))
  with check (app_is_admin() or app_is_responsible_for_participant(participant_id));
create policy "followups_leader_delete" on follow_ups for delete to authenticated
  using (app_is_admin() or app_is_responsible_for_participant(participant_id));

-- ── notifications ────────────────────────────────────────────────────────
alter table notifications enable row level security;

create policy "notifications_select" on notifications for select to authenticated
  using (app_is_admin() or profile_id = auth.uid());
create policy "notifications_update_own" on notifications for update to authenticated
  using (app_is_admin() or profile_id = auth.uid())
  with check (app_is_admin() or profile_id = auth.uid());
create policy "notifications_admin_insert" on notifications for insert to authenticated
  with check (app_is_admin());
create policy "notifications_admin_delete" on notifications for delete to authenticated
  using (app_is_admin());

-- ── audit_log ────────────────────────────────────────────────────────────
-- Sem policy de INSERT/UPDATE/DELETE para ninguém — a única escrita
-- permitida é via app_log_audit_event() (SECURITY DEFINER).
alter table audit_log enable row level security;

create policy "audit_log_admin_select" on audit_log for select to authenticated
  using (app_is_admin());

-- ── app_config ───────────────────────────────────────────────────────────
alter table app_config enable row level security;

create policy "app_config_select" on app_config for select to authenticated
  using (true);
create policy "app_config_admin_write" on app_config for all to authenticated
  using (app_is_admin()) with check (app_is_admin());

-- ── app_terms_versions ──────────────────────────────────────────────────
alter table app_terms_versions enable row level security;

create policy "terms_select" on app_terms_versions for select to authenticated
  using (true);
create policy "terms_admin_write" on app_terms_versions for all to authenticated
  using (app_is_admin()) with check (app_is_admin());

-- ── data_erasure_requests ───────────────────────────────────────────────
alter table data_erasure_requests enable row level security;

create policy "erasure_admin_select" on data_erasure_requests for select to authenticated
  using (app_is_admin());
create policy "erasure_leader_insert" on data_erasure_requests for insert to authenticated
  with check (
    app_is_admin()
    or exists (
      select 1 from participants p
      where p.id = data_erasure_requests.participant_id
        and p.current_leader_id = app_current_leader_id()
    )
  );
create policy "erasure_admin_update" on data_erasure_requests for update to authenticated
  using (app_is_admin()) with check (app_is_admin());
create policy "erasure_admin_delete" on data_erasure_requests for delete to authenticated
  using (app_is_admin());

-- ── Provisionamento automático de profiles no signup ───────────────────
-- Toda nova conta em auth.users ganha uma linha em profiles com role
-- padrão 'lider'. Para promover a primeira admin, rode manualmente:
--   update profiles set role = 'admin' where email = 'email-da-admin@...';
create or replace function app_handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name, email)
  values (
    new.id,
    'lider',
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function app_handle_new_user();
