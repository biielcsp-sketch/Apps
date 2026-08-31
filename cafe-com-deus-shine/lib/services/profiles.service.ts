import "server-only";
import { createClient } from "@/lib/supabase/server";
import { AppError, dbError } from "@/lib/errors";
import type { Tables } from "@/types/database.types";
import type { MyProfileInput } from "@/lib/validators/my-profile.schema";

export type CurrentProfile = Tables<"profiles">;

// Único ponto de verdade para "nível administrativo": admin e desenvolvedor
// têm acesso idêntico (RLS via app_is_admin() já trata os dois como um só
// portão) — toda checagem redundante de papel em Server Action deve usar
// isto em vez de comparar com "admin" diretamente, senão o desenvolvedor
// fica bloqueado em ações que a RLS já libera para ele.
export function isAdminRole(role: CurrentProfile["role"] | undefined | null) {
  return role === "admin" || role === "desenvolvedor";
}

export async function getCurrentProfile(): Promise<CurrentProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) return null;
  // Conta desativada é tratada como sessão inválida em todo o app — todo
  // layout (admin/líder/participante) já chama getCurrentProfile() e
  // redireciona pra /login quando isso retorna null, então desativar aqui
  // é o único ponto necessário pra derrubar o acesso de imediato, mesmo
  // numa sessão já aberta (não precisa esperar o token expirar).
  if (!data.active) return null;
  return data;
}

// Autoatendimento: qualquer usuária autenticada atualiza os PRÓPRIOS
// nome/telefone/whatsapp — nunca aceita um id de outra pessoa, o alvo é
// sempre resolvido pela sessão.
export async function updateMyProfile(input: MyProfileInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new AppError("Sessão expirada. Faça login novamente.");

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: input.full_name,
      phone: input.phone || null,
      whatsapp: input.whatsapp || null,
    })
    .eq("id", user.id);

  if (error) dbError(error, "profiles.updateMy");
}
