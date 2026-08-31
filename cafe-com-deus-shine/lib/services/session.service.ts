import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAuthEvent } from "@/lib/services/auth-audit.service";
import { dbError } from "@/lib/errors";

// S7 (revogação de sessão em mudança de papel/status): derruba todas as
// sessões ativas de um usuário. Chamado sempre que um admin muda o `role`
// de um profile, inativa uma líder (`leaders.status = 'inativa'`), ou
// desativa um profile (`active = false`) — sem isso, alguém rebaixado
// continua com os privilégios antigos até o token expirar naturalmente.
// Ver comentário da migration s7_session_revocation.sql para por que isto
// apaga linhas de `auth.sessions` em vez de usar
// `admin.auth.admin.signOut()` (que exige o JWT da sessão específica, que
// não temos aqui).
export async function revokeUserSessions(profileId: string) {
  const admin = createAdminClient();
  const { error } = await admin.rpc("app_revoke_user_sessions", { p_profile_id: profileId });
  if (error) dbError(error, "session.revoke");

  await logAuthEvent("session_revoked", profileId);
}
