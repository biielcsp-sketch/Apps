revoke execute on function app_is_admin() from public, anon;
revoke execute on function app_current_leader_id() from public, anon;
revoke execute on function app_is_responsible_for_participant(uuid) from public, anon;
revoke execute on function app_log_audit_event(text, text, uuid, jsonb, jsonb) from public, anon;
revoke execute on function app_handle_new_user() from public, anon;

grant execute on function app_is_admin() to authenticated;
grant execute on function app_current_leader_id() to authenticated;
grant execute on function app_is_responsible_for_participant(uuid) to authenticated;
grant execute on function app_log_audit_event(text, text, uuid, jsonb, jsonb) to authenticated;
