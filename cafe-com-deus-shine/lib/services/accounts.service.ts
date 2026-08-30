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

// Cria a conta de uma líder com senha já definida (em vez do convite por
// e-mail de createLeaderAccount) — mesmo efeito final (profile + linha em
// `leaders`), só muda como a senha chega até ela.
export async function createDirectLeaderAccount(input: {
  email: string;
  password: string;
  fullName: string;
  phone?: string | null;
  whatsapp?: string | null;
  city?: string | null;
  neighborhood?: string | null;
  meetingAddress?: string | null;
  region?: string | null;
  maxCapacity: number;
}) {
  const profile = await getCurrentProfile();
  assertDeveloper(profile?.role);

  if (input.maxCapacity <= 0) throw new Error("A capacidade máxima precisa ser maior que zero.");

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

  // app_handle_new_user já criou o profile com role 'lider' (padrão do
  // trigger) e full_name vindo do user_metadata; ajusta telefone/whatsapp.
  await admin
    .from("profiles")
    .update({ phone: input.phone ?? null, whatsapp: input.whatsapp ?? null })
    .eq("id", created.user.id);

  const { error: leaderError } = await admin.from("leaders").insert({
    profile_id: created.user.id,
    city: input.city ?? null,
    neighborhood: input.neighborhood ?? null,
    meeting_address: input.meetingAddress ?? null,
    region: input.region ?? null,
    max_capacity: input.maxCapacity,
    status: "ativa",
  });
  if (leaderError) throw new Error(leaderError.message);

  await logAuditEvent({
    action: "account.create_direct_leader",
    entity: "leaders",
    entityId: created.user.id,
    after: { email: input.email },
  });

  return created.user.id;
}

// Lista participantes que ainda não têm login (profile_id nulo) — só essas
// podem ser vinculadas a uma conta nova. Não criamos participante do zero
// aqui: o cadastro completo (com consentimento LGPD) é sempre feito em
// /participantes/novo primeiro.
export async function listUnclaimedParticipants() {
  const profile = await getCurrentProfile();
  assertDeveloper(profile?.role);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("participants")
    .select("id, full_name, city")
    .is("profile_id", null)
    .is("deleted_at", null)
    .is("anonymized_at", null)
    .order("full_name");

  if (error) throw new Error(error.message);
  return data;
}

// Cria a conta de uma participante já cadastrada (mesmo efeito de
// claimParticipantAccount), mas iniciada pela Desenvolvedor com e-mail e
// senha escolhidos por ela, não pela própria participante.
export async function createDirectParticipantAccount(input: {
  participantId: string;
  email: string;
  password: string;
}) {
  const profile = await getCurrentProfile();
  assertDeveloper(profile?.role);

  const admin = createAdminClient();
  const { data: participant, error: findError } = await admin
    .from("participants")
    .select("id, full_name, profile_id")
    .eq("id", input.participantId)
    .maybeSingle();
  if (findError) throw new Error(findError.message);
  if (!participant) throw new Error("Participante não encontrada.");
  if (participant.profile_id) throw new Error("Esta participante já tem uma conta.");

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: { full_name: participant.full_name },
  });
  if (createError || !created.user) {
    throw new Error(createError?.message ?? "Não foi possível criar a conta.");
  }

  await admin
    .from("profiles")
    .update({ role: "participante", full_name: participant.full_name })
    .eq("id", created.user.id);

  const { error: linkError } = await admin
    .from("participants")
    .update({ profile_id: created.user.id, email: input.email })
    .eq("id", participant.id);
  if (linkError) throw new Error(linkError.message);

  await logAuditEvent({
    action: "account.create_direct_participant",
    entity: "participants",
    entityId: participant.id,
    after: { email: input.email },
  });

  return created.user.id;
}

// Edita nome e/ou papel de uma conta já existente. Trocar PARA ou DE
// líder/participante fica de fora de propósito: essas contas têm registro
// vinculado (leaders/participants) que essa tela não sabe criar nem
// desfazer com segurança — só alterna entre admin e desenvolvedor, os dois
// papéis "de sistema" sem tabela auxiliar.
export async function updateAccount(
  profileId: string,
  input: { fullName: string; role: Extract<Enums<"user_role">, "admin" | "desenvolvedor"> },
) {
  const profile = await getCurrentProfile();
  assertDeveloper(profile?.role);

  const admin = createAdminClient();
  const { data: current, error: currentError } = await admin
    .from("profiles")
    .select("role")
    .eq("id", profileId)
    .single();
  if (currentError) throw new Error(currentError.message);

  const isSystemRole = (r: Enums<"user_role">) => r === "admin" || r === "desenvolvedor";
  if (input.role !== current.role && !isSystemRole(current.role)) {
    throw new Error(
      "Não é possível trocar o papel de uma conta de Líder ou Participante por aqui — use as telas de Líderes/Participantes.",
    );
  }

  const { error } = await admin
    .from("profiles")
    .update({ full_name: input.fullName, role: input.role })
    .eq("id", profileId);
  if (error) throw new Error(error.message);

  await logAuditEvent({
    action: "account.update",
    entity: "profiles",
    entityId: profileId,
    after: { full_name: input.fullName, role: input.role },
  });
}
