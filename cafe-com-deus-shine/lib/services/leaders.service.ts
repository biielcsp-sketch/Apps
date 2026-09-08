import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent } from "@/lib/services/audit.service";
import { getCurrentProfile, isAdminRole } from "@/lib/services/profiles.service";
import { revokeUserSessions } from "@/lib/services/session.service";
import { AppError, dbError } from "@/lib/errors";
import type { Tables, TablesUpdate } from "@/types/database.types";

export type LeaderRow = Tables<"leaders">;

export async function listLeaders() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leaders")
    .select("*, profile:profiles(full_name, email, phone), occupants:participants!participants_current_leader_id_fkey(count)")
    .order("status")
    .order("id");

  if (error) dbError(error, "leaders.list");

  return (data ?? []).map((l) => ({
    ...l,
    full_name: l.profile?.full_name ?? "—",
    email: l.profile?.email ?? null,
    phone: l.profile?.phone ?? null,
    occupied: l.occupants?.[0]?.count ?? 0,
  }));
}

export async function getLeader(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leaders")
    .select("*, profile:profiles(full_name, email, phone, whatsapp)")
    .eq("id", id)
    .single();
  if (error) return null;
  return data;
}

export async function updateLeader(id: string, input: TablesUpdate<"leaders">) {
  const supabase = await createClient();
  if (input.max_capacity !== undefined && input.max_capacity !== null && input.max_capacity <= 0) {
    throw new AppError("A capacidade máxima precisa ser maior que zero.");
  }

  const { data, error } = await supabase.from("leaders").update(input).eq("id", id).select().single();
  if (error) dbError(error, "leaders.update");

  // S7: uma líder inativada não pode continuar usando a sessão que já
  // tinha aberta — sem isso, o acesso dela só cai quando o token expirar
  // naturalmente.
  if (input.status === "inativa") {
    await revokeUserSessions(data.profile_id);
  }

  await logAuditEvent({ action: "leader.update", entity: "leaders", entityId: id, after: input });
  return data;
}

export async function setLeaderStatus(id: string, status: "ativa" | "inativa") {
  return updateLeader(id, { status });
}

export type CreateLeaderAccountInput = {
  full_name: string;
  email: string;
  password: string;
  phone?: string | null;
  whatsapp?: string | null;
  city?: string | null;
  neighborhood?: string | null;
  meeting_address?: string | null;
  region?: string | null;
  max_capacity: number;
  // Co-líder: mesma função da líder (mesma linha em `leaders`, mesmas
  // permissões via app_current_leader_id()) — muda só o rótulo do papel.
  role?: "lider" | "co_lider";
};

// Cria o login da líder e o registro em `leaders`. Usa service_role — só
// chame a partir de uma Server Action que já validou que quem está pedindo
// é admin.
//
// A conta nasce com senha provisória e e-mail já confirmado, no mesmo
// molde de claimParticipantAccount(). Antes isso era um convite por
// e-mail (inviteUserByEmail), que dependia do serviço de e-mail embutido
// do Supabase — limitado a poucos envios por hora e, nas palavras da
// própria documentação deles, "para experimentar", com disponibilidade
// best-effort. Na prática o cadastro travava a partir da segunda líder
// seguida. Sem e-mail nenhum, não há limite nenhum: a pastora passa a
// senha por WhatsApp e a líder é obrigada a trocar no primeiro acesso.
export async function createLeaderAccount(input: CreateLeaderAccountInput) {
  // Checagem redundante: a Server Action que chama isto já valida admin, mas
  // service_role ignora RLS — repetimos a checagem aqui (defesa em
  // profundidade) para que um futuro caller desprotegido não vire um convite
  // de líder disparado por qualquer usuário autenticado.
  const profile = await getCurrentProfile();
  if (!isAdminRole(profile?.role)) {
    throw new AppError("Apenas administradoras podem cadastrar líderes.");
  }

  if (input.max_capacity <= 0) throw new AppError("A capacidade máxima precisa ser maior que zero.");

  const admin = createAdminClient();
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    // Sem e-mail de confirmação: quem cadastrou foi a pastora, o endereço
    // já veio conferido por ela.
    email_confirm: true,
    // `must_change_password` é lido pelo proxy.ts direto do usuário da
    // sessão (sem consulta extra ao banco) para empurrar a líder à troca
    // no primeiro acesso. Não é barreira de segurança — user_metadata é
    // gravável pela própria usuária —, é o que faz a senha provisória não
    // virar definitiva por esquecimento.
    user_metadata: { full_name: input.full_name, must_change_password: true },
  });
  if (createError || !created.user) {
    // O erro de e-mail repetido é o único que a admin consegue resolver
    // sozinha, então ele merece uma frase própria.
    const alreadyExists =
      createError?.code === "email_exists" ||
      /already been registered|already exists/i.test(createError?.message ?? "");
    dbError(
      createError,
      "leaders.create.createUser",
      alreadyExists
        ? "Já existe uma conta com esse e-mail. Confira a lista de lideranças ou use outro endereço."
        : "Não foi possível criar o acesso da líder.",
    );
  }

  // app_handle_new_user já criou o profile com role 'lider'; ajusta
  // telefone/whatsapp e, quando for co-líder, o papel.
  const roleToSet = input.role === "co_lider" ? "co_lider" : null;
  if (input.phone || input.whatsapp || roleToSet) {
    await admin
      .from("profiles")
      .update({
        phone: input.phone ?? null,
        whatsapp: input.whatsapp ?? null,
        ...(roleToSet ? { role: roleToSet } : {}),
      })
      .eq("id", created.user.id);
  }

  const { data: leader, error: leaderError } = await admin
    .from("leaders")
    .insert({
      profile_id: created.user.id,
      city: input.city ?? null,
      neighborhood: input.neighborhood ?? null,
      meeting_address: input.meeting_address ?? null,
      region: input.region ?? null,
      max_capacity: input.max_capacity,
      status: "ativa",
    })
    .select()
    .single();
  if (leaderError) dbError(leaderError, "leaders.create");

  await logAuditEvent({
    action: "leader.create",
    entity: "leaders",
    entityId: leader.id,
    after: { full_name: input.full_name, email: input.email },
  });

  return leader;
}

// Contas com papel Anfitriã, para o seletor do formulário de grupo.
export async function listHostsForSelect() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("role", "anfitria")
    .eq("active", true)
    .order("full_name");

  if (error) dbError(error, "leaders.listHostsForSelect");
  return data ?? [];
}

// Exclui a líder de verdade: a linha de `leaders`, o profile e o login.
// Só passa quando não há nada pendurado nela — participantes, grupos,
// encontros, acompanhamentos ou histórico de vínculo. Todas essas FKs são
// "no action" no banco, então apagar com histórico não é uma escolha de
// produto: o Postgres recusaria. Quando há histórico, o caminho certo é
// inativar (a líder some das listas de distribuição e perde a sessão, mas
// os encontros dela continuam existindo).
export async function deleteLeader(id: string) {
  const profile = await getCurrentProfile();
  if (!isAdminRole(profile?.role)) {
    throw new AppError("Apenas a pastora ou a desenvolvedora podem excluir uma líder.");
  }

  const admin = createAdminClient();
  const { data: leader, error: leaderError } = await admin
    .from("leaders")
    .select("id, profile_id, profile:profiles(full_name)")
    .eq("id", id)
    .single();
  if (leaderError || !leader) throw new AppError("Líder não encontrada.");

  if (leader.profile_id === profile!.id) {
    throw new AppError("Você não pode excluir o seu próprio cadastro de líder.");
  }

  // Uma consulta por tabela em vez de um laço genérico: o tipo gerado do
  // banco amarra o nome da coluna à tabela, então um laço só passaria com
  // `any` — e aqui errar a coluna significaria excluir com histórico.
  const [participantes, cafes, encontros, acompanhamentos, historico] = await Promise.all([
    admin.from("participants").select("id", { count: "exact", head: true }).eq("current_leader_id", id),
    admin.from("groups").select("id", { count: "exact", head: true }).eq("leader_id", id),
    admin.from("meetings").select("id", { count: "exact", head: true }).eq("leader_id", id),
    admin.from("follow_ups").select("id", { count: "exact", head: true }).eq("leader_id", id),
    admin.from("participant_leader_history").select("id", { count: "exact", head: true }).eq("leader_id", id),
  ]);

  const vinculos: { rotulo: string; total: number }[] = [];
  for (const [rotulo, resultado] of [
    ["participante(s) sob responsabilidade dela", participantes],
    ["café(s) liderado(s) por ela", cafes],
    ["encontro(s) registrado(s)", encontros],
    ["acompanhamento(s) escrito(s)", acompanhamentos],
    ["registro(s) no histórico de vínculo", historico],
  ] as const) {
    if (resultado.error) dbError(resultado.error, "leaders.delete.check");
    if (resultado.count && resultado.count > 0) {
      vinculos.push({ rotulo, total: resultado.count });
    }
  }

  if (vinculos.length > 0) {
    const lista = vinculos.map((v) => `${v.total} ${v.rotulo}`).join(", ");
    throw new AppError(
      `Não dá para excluir: esta líder tem ${lista}. Apagar levaria junto esse histórico. ` +
        'Transfira as participantes para outra líder e, se ela saiu da equipe, use "Inativar líder".',
    );
  }

  const { error: deleteLeaderError } = await admin.from("leaders").delete().eq("id", id);
  if (deleteLeaderError) dbError(deleteLeaderError, "leaders.delete.leader");

  // O profile pode ter histórico próprio (audit_log, presença registrada).
  // Se tiver, o Postgres recusa e paramos aqui: a linha de `leaders` já
  // saiu, então ela deixa de ser líder de fato; sobra só o login, que a
  // desenvolvedora desativa em Contas.
  const { error: profileError } = await admin.from("profiles").delete().eq("id", leader.profile_id);
  if (!profileError) {
    const { error: authError } = await admin.auth.admin.deleteUser(leader.profile_id);
    if (authError) dbError(authError, "leaders.delete.auth");
  }

  await logAuditEvent({
    action: "leader.delete",
    entity: "leaders",
    entityId: id,
    after: {
      full_name: leader.profile?.full_name ?? null,
      login_removido: !profileError,
    },
  });

  return { loginRemovido: !profileError };
}
