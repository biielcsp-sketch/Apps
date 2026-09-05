import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile, isAdminRole } from "@/lib/services/profiles.service";
import { logAuditEvent } from "@/lib/services/audit.service";
import { AppError, dbError } from "@/lib/errors";

const CONFIG_KEY = "cafe_rules";
const MAX_LENGTH = 5000;

// Texto das regras do café, escrito uma vez pela pastora e exibido para a
// participante (no formulário público e na tela dela). Leitura é liberada
// para qualquer visitante — o formulário público precisa mostrar as regras
// antes mesmo de existir uma sessão.
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
