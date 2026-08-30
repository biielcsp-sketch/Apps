import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent } from "@/lib/services/audit.service";
import { getCurrentProfile } from "@/lib/services/profiles.service";
import type { Enums } from "@/types/database.types";

function assertDeveloper(role: Enums<"user_role"> | undefined | null) {
  if (role !== "desenvolvedor") {
    throw new Error("Apenas o perfil Desenvolvedor pode usar esta função.");
  }
}

// Lista todas as contas do sistema — usa o client normal (RLS): a policy
// "profiles_select" já libera app_is_admin() (admin OU desenvolvedor) para
// ver todas as linhas, não precisa de service_role aqui.
export async function listAllAccounts() {
  const profile = await getCurrentProfile();
  assertDeveloper(profile?.role);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, active, created_at")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function getAccount(id: string) {
  const profile = await getCurrentProfile();
  assertDeveloper(profile?.role);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, active, created_at")
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// Redefine a senha de QUALQUER conta diretamente — nos mesmos moldes da
// função de reset de senha do perfil desenvolvedor do app de referência.
// Precisa de service_role (Auth Admin API); checagem de papel repetida
// aqui mesmo (defesa em profundidade, service_role ignora RLS).
export async function resetUserPassword(profileId: string, newPassword: string) {
  const profile = await getCurrentProfile();
  assertDeveloper(profile?.role);

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(profileId, { password: newPassword });
  if (error) throw new Error(error.message);

  await logAuditEvent({
    action: "account.reset_password",
    entity: "profiles",
    entityId: profileId,
  });
}

// Troca o e-mail de login de QUALQUER conta — atualiza tanto o auth.users
// (via Admin API, já confirmado, sem precisar da usuária clicar em link de
// verificação) quanto profiles.email, que não se sincroniza sozinho.
export async function updateUserEmail(profileId: string, newEmail: string) {
  const profile = await getCurrentProfile();
  assertDeveloper(profile?.role);

  const admin = createAdminClient();
  const { error: authError } = await admin.auth.admin.updateUserById(profileId, {
    email: newEmail,
    email_confirm: true,
  });
  if (authError) throw new Error(authError.message);

  const { error: profileError } = await admin
    .from("profiles")
    .update({ email: newEmail })
    .eq("id", profileId);
  if (profileError) throw new Error(profileError.message);

  await logAuditEvent({
    action: "account.update_email",
    entity: "profiles",
    entityId: profileId,
    after: { email: newEmail },
  });
}

// Criação direta de conta com senha definida na hora, sem passar por convite
// por e-mail nem pelo autocadastro de participante. Restrita a admin/
// desenvolvedor (não gera `leaders`/`participants`) — exclusiva para o papel
// "Desenvolvedor", nos mesmos moldes de "Criação Direta de Conta" do app de
// referência. A Server Action que chama isto já valida o papel, mas
// service_role ignora RLS — repetimos a checagem aqui (defesa em
// profundidade): mesmo admin comum não pode chamar isto, só desenvolvedor.
export async function createDirectAccount(input: {
  email: string;
  password: string;
  fullName: string;
  role: Extract<Enums<"user_role">, "admin" | "desenvolvedor">;
}) {
  const profile = await getCurrentProfile();
  assertDeveloper(profile?.role);

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
