import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile, isAdminRole } from "@/lib/services/profiles.service";
import { logAuditEvent } from "@/lib/services/audit.service";
import { AppError, dbError } from "@/lib/errors";

const CONFIG_KEY = "cafe_rules";
const MAX_LENGTH = 5000;

// Texto das regras do café, escrito uma vez pela pastora e exibido para a
// participante na tela dela. Para telas sem sessão use
// `getPublicCafeRules()` — a policy de SELECT desta tabela é só para
// `authenticated`.
export async function getCafeRules(): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("app_config")
    .select("value")
    .eq("key", CONFIG_KEY)
    .maybeSingle();

  if (error) dbError(error, "cafeRules.get");

  const value = data?.value as { text?: string } | null;
  return value?.text?.trim() ?? "";
}

// Mesma leitura, mas para quem ainda não tem sessão (landing e formulário
// público). A policy de SELECT de `app_config` é só para `authenticated`,
// então o client normal devolveria vazio para a visitante — aqui o
// service_role lê a chave, e nada além do texto das regras sai daqui.
export async function getPublicCafeRules(): Promise<string> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("app_config")
    .select("value")
    .eq("key", CONFIG_KEY)
    .maybeSingle();

  if (error) dbError(error, "cafeRules.getPublic");

  const value = data?.value as { text?: string } | null;
  return value?.text?.trim() ?? "";
}

export async function updateCafeRules(text: string) {
  const profile = await getCurrentProfile();
  if (!isAdminRole(profile?.role)) {
    throw new AppError("Apenas administradoras podem editar as regras do café.");
  }
  if (text.length > MAX_LENGTH) {
    throw new AppError("O texto das regras está muito longo.");
  }

  // service_role: app_config é uma tabela de configuração global sem policy
  // de escrita para usuária comum — a checagem de papel acima é a barreira.
  const admin = createAdminClient();
  const { error } = await admin
    .from("app_config")
    .upsert({ key: CONFIG_KEY, value: { text: text.trim() }, updated_at: new Date().toISOString() });

  if (error) dbError(error, "cafeRules.update");

  await logAuditEvent({
    action: "cafe_rules.update",
    entity: "app_config",
    entityId: null,
  });
}
