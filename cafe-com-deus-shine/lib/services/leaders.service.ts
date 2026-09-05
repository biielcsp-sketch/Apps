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

// Cria o login da líder (convite por e-mail via Supabase Auth) e o
// registro em `leaders`. Usa service_role — só chame a partir de uma
// Server Action que já validou que quem está pedindo é admin.
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
  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
    input.email,
    { data: { full_name: input.full_name } },
  );
  if (inviteError || !invited.user) {
    dbError(inviteError, "leaders.create.invite", "Não foi possível convidar a líder.");
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
      .eq("id", invited.user.id);
  }

  const { data: leader, error: leaderError } = await admin
    .from("leaders")
    .insert({
      profile_id: invited.user.id,
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
