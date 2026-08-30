import "server-only";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import type { Enums, Json } from "@/types/database.types";

async function requestMeta() {
  const h = await headers();
  return {
    ip: h.get("x-nf-client-connection-ip") ?? h.get("x-forwarded-for") ?? null,
    userAgent: h.get("user-agent"),
  };
}

// S5: log de eventos de autenticação/acesso negado, separado do audit_log
// (que cobre mutação de dado de negócio). Nunca deixamos uma falha aqui
// travar o fluxo do usuário — só logamos o erro e seguimos, mesma regra do
// prompt para não transformar auditoria em ponto único de falha.
export async function logAuthEvent(
  event: Enums<"auth_audit_event">,
  profileId: string | null,
  metadata?: Json,
) {
  try {
    const { ip, userAgent } = await requestMeta();
    const supabase = await createClient();
    // Os tipos gerados marcam p_profile_id/p_ip_address/p_user_agent como
    // `string` (não `string | null`) porque o gerador do Supabase não
    // introspecciona nulabilidade de parâmetro escalar — a função aceita
    // NULL normalmente em runtime (nenhum é NOT NULL na assinatura SQL).
    await supabase.rpc("app_log_auth_event", {
      p_profile_id: profileId,
      p_event: event,
      p_ip_address: ip,
      p_user_agent: userAgent,
      p_metadata: metadata ?? null,
    } as unknown as Parameters<typeof supabase.rpc<"app_log_auth_event">>[1]);
  } catch (e) {
    console.error(`[auth-audit] falha ao registrar evento "${event}":`, e);
  }
}

// Uma violação de RLS em INSERT/UPDATE chega do Postgres como erro 42501
// ("new row violates row-level security policy" / "permission denied for
// table ..."). Uma leitura bloqueada por RLS não gera erro nenhum — a
// policy de SELECT simplesmente filtra a linha, então não tem como
// distinguir "não existe" de "está escondida por RLS" nesse caminho (é
// assim que RLS de SELECT é desenhado, de propósito, para evitar
// enumeração). Por isso só capturamos acesso negado em escrita.
//
// Checamos o texto da mensagem, não um `.code` estruturado: todo service
// deste projeto já converte o erro do Postgrest em `new Error(error.message)`
// antes de propagar (padrão usado em todo /lib/services), o que descarta o
// campo `.code` original — casar pela mensagem é o que sobra e o que
// realmente chega até a Server Action.
export function isRlsDenied(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /row-level security policy|permission denied for table/i.test(message);
}
