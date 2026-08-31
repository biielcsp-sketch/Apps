import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent } from "@/lib/services/audit.service";
import { getCurrentProfile } from "@/lib/services/profiles.service";
import { revokeUserSessions } from "@/lib/services/session.service";
import { AppError, dbError } from "@/lib/errors";
import type { Enums } from "@/types/database.types";

function assertDeveloper(role: Enums<"user_role"> | undefined | null) {
  if (role !== "desenvolvedor") {
    throw new AppError("Apenas o perfil Desenvolvedor pode usar esta função.");
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

  if (error) dbError(error, "accounts.listAll");
  return data;
}

export async function getAccount(id: string) {
  const profile = await getCurrentProfile();
  assertDeveloper(profile?.role);

  const supabase = await createClient();
  const [{ data, error }, { data: leaderRow }, { data: participantRow }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, email, role, active, created_at").eq("id", id).single(),
    supabase.from("leaders").select("id").eq("profile_id", id).maybeSingle(),
    supabase.from("participants").select("id").eq("profile_id", id).maybeSingle(),
  ]);

  if (error) dbError(error, "accounts.get");
  return { ...data, hasLeaderRow: Boolean(leaderRow), hasParticipantRow: Boolean(participantRow) };
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
  if (error) dbError(error, "accounts.resetPassword");

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
  if (authError) dbError(authError, "accounts.updateEmail.auth");

  const { error: profileError } = await admin
    .from("profiles")
    .update({ email: newEmail })
    .eq("id", profileId);
  if (profileError) dbError(profileError, "accounts.updateEmail.profile");

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
    dbError(createError, "accounts.createDirect.createUser", "Não foi possível criar a conta.");
  }

  const { error: profileError } = await admin
    .from("profiles")
    .update({ role: input.role, full_name: input.fullName })
    .eq("id", created.user.id);
  if (profileError) dbError(profileError, "accounts.createDirect.profile");

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

  if (input.maxCapacity <= 0) throw new AppError("A capacidade máxima precisa ser maior que zero.");

  const admin = createAdminClient();
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: { full_name: input.fullName },
  });
  if (createError || !created.user) {
    dbError(createError, "accounts.createDirectLeader.createUser", "Não foi possível criar a conta.");
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
  if (leaderError) dbError(leaderError, "accounts.createDirectLeader.leader");

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

  if (error) dbError(error, "accounts.listUnclaimedParticipants");
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
  if (findError) dbError(findError, "accounts.createDirectParticipant.find");
  if (!participant) throw new AppError("Participante não encontrada.");
  if (participant.profile_id) throw new AppError("Esta participante já tem uma conta.");

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: { full_name: participant.full_name },
  });
  if (createError || !created.user) {
    dbError(createError, "accounts.createDirectParticipant.createUser", "Não foi possível criar a conta.");
  }

  await admin
    .from("profiles")
    .update({ role: "participante", full_name: participant.full_name })
    .eq("id", created.user.id);

  const { error: linkError } = await admin
    .from("participants")
    .update({ profile_id: created.user.id, email: input.email })
    .eq("id", participant.id);
  if (linkError) dbError(linkError, "accounts.createDirectParticipant.link");

  await logAuditEvent({
    action: "account.create_direct_participant",
    entity: "participants",
    entityId: participant.id,
    after: { email: input.email },
  });

  return created.user.id;
}

// Edita nome e papel de uma conta já existente — os 4 papéis, igual à
// criação. Trocar PARA líder/participante exige os mesmos dados que a
// criação direta pediria (capacidade da líder, ou a participante já
// cadastrada a vincular), só quando a conta ainda não tem a linha
// correspondente em `leaders`/`participants` — se ela já teve esse papel
// antes (ex.: foi líder, virou admin, volta a ser líder), a linha antiga
// continua lá e é só reaproveitada, sem pedir os dados de novo.
export async function updateAccount(
  profileId: string,
  input: {
    fullName: string;
    role: Enums<"user_role">;
    leader?: {
      city?: string | null;
      neighborhood?: string | null;
      meetingAddress?: string | null;
      region?: string | null;
      maxCapacity: number;
    };
    participantId?: string;
  },
) {
  const profile = await getCurrentProfile();
  assertDeveloper(profile?.role);

  const admin = createAdminClient();
  const { data: current, error: currentError } = await admin
    .from("profiles")
    .select("role")
    .eq("id", profileId)
    .single();
  if (currentError) dbError(currentError, "accounts.update.current");

  const changingRole = input.role !== current.role;

  if (changingRole && input.role === "lider") {
    const { data: existingLeader } = await admin
      .from("leaders")
      .select("id")
      .eq("profile_id", profileId)
      .maybeSingle();

    if (!existingLeader) {
      if (!input.leader || !(input.leader.maxCapacity > 0)) {
        throw new AppError("Informe a capacidade máxima para transformar esta conta em líder.");
      }
      const { error: leaderError } = await admin.from("leaders").insert({
        profile_id: profileId,
        city: input.leader.city ?? null,
        neighborhood: input.leader.neighborhood ?? null,
        meeting_address: input.leader.meetingAddress ?? null,
        region: input.leader.region ?? null,
        max_capacity: input.leader.maxCapacity,
        status: "ativa",
      });
      if (leaderError) dbError(leaderError, "accounts.update.becomeLeader");
    }
  }

  if (changingRole && input.role === "participante") {
    const { data: alreadyLinked } = await admin
      .from("participants")
      .select("id")
      .eq("profile_id", profileId)
      .maybeSingle();

    if (!alreadyLinked) {
      if (!input.participantId) {
        throw new AppError("Selecione a participante já cadastrada para vincular a esta conta.");
      }
      const { data: participant, error: findError } = await admin
        .from("participants")
        .select("id, profile_id")
        .eq("id", input.participantId)
        .maybeSingle();
      if (findError) dbError(findError, "accounts.update.becomeParticipant.find");
      if (!participant) throw new AppError("Participante não encontrada.");
      if (participant.profile_id) throw new AppError("Esta participante já tem uma conta.");

      const { error: linkError } = await admin
        .from("participants")
        .update({ profile_id: profileId })
        .eq("id", participant.id);
      if (linkError) dbError(linkError, "accounts.update.becomeParticipant.link");
    }
  }

  const { error } = await admin
    .from("profiles")
    .update({ full_name: input.fullName, role: input.role })
    .eq("id", profileId);
  if (error) dbError(error, "accounts.update");

  // Sem isto, alguém rebaixada de admin pra líder (ou qualquer outra troca
  // de papel) continuaria com os privilégios antigos até o token expirar
  // naturalmente — a policy de RLS já muda na próxima query, mas a sessão
  // em si (refresh token) seguiria viva.
  if (changingRole) {
    await revokeUserSessions(profileId);
  }

  await logAuditEvent({
    action: "account.update",
    entity: "profiles",
    entityId: profileId,
    after: { full_name: input.fullName, role: input.role },
  });
}

// Ativa/desativa uma conta — bloqueia login e derruba qualquer sessão já
// aberta imediatamente (revokeUserSessions), com getCurrentProfile
// tratando active=false como "sem sessão" como segunda camada (útil se o
// token ainda não tiver sido invalidado no momento exato da requisição).
// Alternativa segura à exclusão para quem tem histórico vinculado
// (audit_log, presença registrada etc.) e não pode ser excluído de
// verdade — ver deleteAccount().
export async function setAccountActive(profileId: string, active: boolean) {
  const profile = await getCurrentProfile();
  assertDeveloper(profile?.role);

  if (profile!.id === profileId && !active) {
    throw new AppError("Você não pode desativar a própria conta.");
  }

  const admin = createAdminClient();
  const { error } = await admin.from("profiles").update({ active }).eq("id", profileId);
  if (error) dbError(error, "accounts.setActive");

  if (!active) {
    await revokeUserSessions(profileId);
  }

  await logAuditEvent({
    action: active ? "account.activate" : "account.deactivate",
    entity: "profiles",
    entityId: profileId,
  });
}

// Exclui a conta (login) de verdade — não confundir com anonimização de
// participante (que é sobre o CADASTRO dela, não o login). Duas travas
// reais, não arbitrárias:
// 1. Líder nunca pode ser excluída por aqui: leaders.profile_id é NOT NULL
//    (schema), não dá pra desvincular sem deixar a linha órfã — a via seg-
//    ura é inativar em /liderancas.
// 2. Qualquer conta com histórico vinculado (audit_log, presença
//    registrada, notificações etc.) tem FK "no action" pra profiles — o
//    Postgres recusa a exclusão sozinho. Nesse caso, sugerimos desativar
//    em vez de inventar uma forma de apagar o histórico.
export async function deleteAccount(profileId: string) {
  const profile = await getCurrentProfile();
  assertDeveloper(profile?.role);

  if (profile!.id === profileId) {
    throw new AppError("Você não pode excluir a própria conta.");
  }

  const admin = createAdminClient();
  const { data: target, error: targetError } = await admin
    .from("profiles")
    .select("role")
    .eq("id", profileId)
    .single();
  if (targetError) dbError(targetError, "accounts.delete.target");

  if (target.role === "lider") {
    throw new AppError(
      'Não é possível excluir uma conta de Líder — use "Inativar" na tela de Líderes. Excluir aqui deixaria o grupo sem responsável.',
    );
  }

  if (target.role === "participante") {
    // Desvincula o login do cadastro — o cadastro da participante (jornada,
    // presença, acompanhamento) continua intacto, só perde o acesso.
    await admin.from("participants").update({ profile_id: null }).eq("profile_id", profileId);
  }

  const { error: profileError } = await admin.from("profiles").delete().eq("id", profileId);
  if (profileError) {
    dbError(
      profileError,
      "accounts.delete.profile",
      "Esta conta tem histórico vinculado (ações registradas, presença, etc.) e não pode ser excluída sem perder esse histórico. Desative a conta em vez de excluir.",
    );
  }

  const { error: authError } = await admin.auth.admin.deleteUser(profileId);
  if (authError) dbError(authError, "accounts.delete.auth");

  await logAuditEvent({
    action: "account.delete",
    entity: "profiles",
    entityId: profileId,
    after: { role: target.role },
  });
}
