-- Índices de FK sinalizados pelo advisor de performance (útil à medida que
-- o volume de dados cresce — item 35 da especificação: escalabilidade).
create index if not exists idx_attendance_registered_by on attendance(registered_by);
create index if not exists idx_audit_log_actor on audit_log(actor_profile_id);
create index if not exists idx_erasure_participant on data_erasure_requests(participant_id);
create index if not exists idx_erasure_processed_by on data_erasure_requests(processed_by);
create index if not exists idx_erasure_requested_by on data_erasure_requests(requested_by);
create index if not exists idx_followups_leader on follow_ups(leader_id);
create index if not exists idx_groups_leader on groups(leader_id);
create index if not exists idx_leaders_profile on leaders(profile_id);
create index if not exists idx_meeting_participants_participant on meeting_participants(participant_id);
create index if not exists idx_meetings_leader on meetings(leader_id);
create index if not exists idx_plh_changed_by on participant_leader_history(changed_by);
create index if not exists idx_plh_group on participant_leader_history(group_id);
create index if not exists idx_psh_changed_by on participant_status_history(changed_by);
create index if not exists idx_psh_participant on participant_status_history(participant_id);
create index if not exists idx_participants_group on participants(current_group_id);
create index if not exists idx_participants_profile on participants(profile_id);

-- Evita reavaliação de auth.uid() por linha (recomendação do linter do
-- Supabase para RLS em escala).
alter policy "profiles_select" on profiles using (id = (select auth.uid()) or app_is_admin());
alter policy "profiles_update" on profiles
  using (id = (select auth.uid()) or app_is_admin())
  with check (id = (select auth.uid()) or app_is_admin());
alter policy "leaders_select" on leaders using (app_is_admin() or profile_id = (select auth.uid()));
alter policy "notifications_select" on notifications using (app_is_admin() or profile_id = (select auth.uid()));
alter policy "notifications_update_own" on notifications
  using (app_is_admin() or profile_id = (select auth.uid()))
  with check (app_is_admin() or profile_id = (select auth.uid()));
