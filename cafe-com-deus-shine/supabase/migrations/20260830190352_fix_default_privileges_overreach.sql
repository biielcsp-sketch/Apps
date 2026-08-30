-- Correção de um erro na migration anterior: "alter default privileges in
-- schema public revoke execute on functions from authenticated" muda o
-- padrão para TODA função futura do schema, não só a função de trigger que
-- eu queria travar — isso quebraria silenciosamente qualquer RPC nova
-- pensada para `authenticated` (o padrão intencional deste projeto), a
-- menos que cada migration futura lembrasse de conceder EXECUTE de novo.
-- Restaura o default privileges original (GRANT, não REVOKE) para
-- `authenticated` em funções novas. A função específica
-- (app_guard_profile_self_update) continua revogada — isso não muda.
alter default privileges in schema public grant execute on functions to authenticated;
