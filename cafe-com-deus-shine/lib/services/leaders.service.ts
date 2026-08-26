import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent } from "@/lib/services/audit.service";
import type { Tables, TablesUpdate } from "@/types/database.types";

export type LeaderRow = Tables<"leaders">;

export async function listLeaders() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leaders")
    .select("*, profile:profiles(full_name, email, phone), occupants:participants!participants_current_leader_id_fkey(count)")
    .order("status")
    .order("id");

  if (error) throw new Error(error.message);

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
    throw new Error("A capacidade máxima precisa ser maior que zero.");
  }

  const { data, error } = await supabase.from("leaders").update(input).eq("id", id).select().single();
  if (error) throw new Error(error.message);

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
};

// Cria o login da líder (convite por e-mail via Supabase Auth) e o
// registro em `leaders`. Usa service_role — só chame a partir de uma
// Server Action que já validou que quem está pedindo é admin.
export async function createLeaderAccount(input: CreateLeaderAccountInput) {
  if (input.max_capacity <= 0) throw new Error("A capacidade máxima precisa ser maior que zero.");

  const admin = createAdminClient();
  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
    input.email,
    { data: { full_name: input.full_name } },
  );
  if (inviteError || !invited.user) {
    throw new Error(inviteError?.message ?? "Não foi possível convidar a líder.");
  }

  // app_handle_new_user já criou o profile com role 'lider'; ajusta
  // telefone/whatsapp se informados.
  if (input.phone || input.whatsapp) {
    await admin
      .from("profiles")
      .update({ phone: input.phone ?? null, whatsapp: input.whatsapp ?? null })
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
  if (leaderError) throw new Error(leaderError.message);

  await logAuditEvent({
    action: "leader.create",
    entity: "leaders",
    entityId: leader.id,
    after: { full_name: input.full_name, email: input.email },
  });

  return leader;
}
