-- "revoke ... from public" não bastou: o Supabase concede EXECUTE em toda
-- função nova diretamente para os papéis anon/authenticated (default
-- privileges), não via o pseudo-papel PUBLIC — precisa revogar dos dois
-- explicitamente, mesmo padrão já usado em lock_down_rpc_functions.sql.
revoke execute on function app_rate_limit_hit(text, integer, integer) from anon, authenticated;
alter default privileges in schema public revoke execute on functions from anon;
