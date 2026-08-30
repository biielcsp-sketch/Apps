import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database.types";

// S3 (headers de segurança): @supabase/ssr usa sameSite "lax" por padrão
// (adequado) mas não seta "secure" — setamos explícito para produção.
// "httpOnly" fica de propósito como false: é o próprio @supabase/ssr que
// exige leitura via document.cookie no client para gerenciar a sessão —
// setar httpOnly quebraria o login, não é uma opção de hardening viável
// aqui (a sessão em si é um JWT de curta duração, renovado pelo proxy.ts).
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      },
    },
  );
}
