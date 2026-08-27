revoke execute on function app_current_participant_id() from public, anon;
revoke execute on function app_guard_participant_self_update() from public, anon, authenticated;

grant execute on function app_current_participant_id() to authenticated;
