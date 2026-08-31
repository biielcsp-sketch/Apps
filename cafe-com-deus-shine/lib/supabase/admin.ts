import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { serverEnv } from "@/lib/env";
import type { Database } from "@/types/database.types";

// Cliente com service_role — bypassa RLS. NUNCA importar isso de um
// Client Component nem expor a chave ao navegador. Uso restrito a ações
// administrativas pontuais que exigem a Auth Admin API (ex.: convidar
// uma nova líder), sempre atrás de uma checagem de papel 'admin'.
// `serverEnv` (S7) já garante, desde o boot do processo, que a chave
// existe e não está vazia — não precisa checar de novo aqui.
export function createAdminClient() {
  return createSupabaseClient<Database>(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
