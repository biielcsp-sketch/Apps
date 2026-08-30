import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent } from "@/lib/services/audit.service";
import type { Enums } from "@/types/database.types";

// Criação direta de conta com senha definida na hora, sem passar por convite
// por e-mail nem pelo autocadastro de participante. Restrita a admin/
// desenvolvedor (não gera `leaders`/`participants`) — exclusiva para o papel
// "Desenvolvedor", nos mesmos moldes de "Criação Direta de Conta" do app de
// referência. A checagem de quem pode chamar isso fica na Server Action.
export async function createDirectAccount(input: {
  email: string;
  password: string;
  fullName: string;
  role: Extract<Enums<"user_role">, "admin" | "desenvolvedor">;
}) {
  const admin = createAdminClient();
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: { full_name: input.fullName },
  });
  if (createError || !created.user) {
    throw new Error(createError?.message ?? "Não foi possível criar a conta.");
  }

  const { error: profileError } = await admin
    .from("profiles")
    .update({ role: input.role, full_name: input.fullName })
    .eq("id", created.user.id);
  if (profileError) throw new Error(profileError.message);

  await logAuditEvent({
    action: "account.create_direct",
    entity: "profiles",
    entityId: created.user.id,
    after: { email: input.email, role: input.role },
  });

  return created.user.id;
}
