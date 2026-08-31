-- S7 (fechamento do pacote de segurança), bloco 3: revogação de sessão
-- quando papel/status muda. Sem isso, alguém rebaixado de admin pra líder
-- (ou uma líder inativada) continua com o token antigo válido até expirar
-- naturalmente — a policy de RLS já muda na próxima query, mas a sessão em
-- si (refresh token) segue viva.
--
-- O supabase-js (Admin API) não expõe um "derrubar todas as sessões deste
-- usuário" por id — só `admin.auth.admin.signOut(jwt, scope)`, que exige o
-- JWT da sessão específica, que não temos aqui (é a admin derrubando a
-- sessão de outra pessoa, não a própria). O mecanismo real, documentado
-- pela própria Supabase para este cenário, é apagar as linhas da usuária em
-- `auth.sessions` — o refresh (e a validação de sessão feita por
-- `getUser()`, que sempre bate no Auth server) passam a falhar
-- imediatamente.
create or replace function app_revoke_user_sessions(p_profile_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  delete from auth.sessions where user_id = p_profile_id;
end;
$$;
revoke all on function app_revoke_user_sessions(uuid) from public, anon, authenticated;
-- Só o backend (service_role), a partir de accounts.service.ts/
-- leaders.service.ts, chama isto — nunca diretamente pelo client.
grant execute on function app_revoke_user_sessions(uuid) to service_role;

-- Novo tipo de evento em auth_audit_log (S5) para registrar quando isto
-- acontece.
alter type auth_audit_event add value 'session_revoked';
