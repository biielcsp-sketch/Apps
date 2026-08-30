-- app_guard_profile_self_update() é uma função de trigger (BEFORE UPDATE),
-- nunca deveria ser chamável via RPC direto (/rest/v1/rpc/...) — mesmo
-- padrão já aplicado em app_guard_participant_self_update() na migration
-- lock_down_participant_self_service_fns.sql.
--
-- NOTA: o "alter default privileges ... from authenticated" abaixo foi um
-- erro (mudava o padrão para TODA função futura do schema, não só esta) —
-- corrigido na migration seguinte (fix_default_privileges_overreach).
revoke execute on function app_guard_profile_self_update() from authenticated;
alter default privileges in schema public revoke execute on functions from authenticated;
