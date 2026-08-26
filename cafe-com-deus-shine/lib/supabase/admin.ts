import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

// Cliente com service_role — bypassa RLS. NUNCA importar isso de um
// Client Component nem expor a chave ao navegador. Uso restrito a ações
// administrativas pontuais que exigem a Auth Admin API (ex.: convidar
// uma nova líder), sempre atrás de uma checagem de papel 'admin'.
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY não configurada — necessária para convidar novas líderes.",
    );
  }

  return createSupabaseClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
