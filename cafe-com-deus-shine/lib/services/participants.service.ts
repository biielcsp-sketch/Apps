import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent } from "@/lib/services/audit.service";
import type { Tables, TablesInsert, Enums } from "@/types/database.types";
import type {
  ParticipantCreateInput,
  ParticipantPersonalInput,
  ParticipantSelfEditInput,
} from "@/lib/validators/participant.schema";

export type ParticipantRow = Tables<"participants">;

export type ParticipantListItem = ParticipantRow & {
  leader: { id: string; full_name: string } | null;
  group: { id: string; name: string } | null;
};

export type ParticipantFilters = {
  search?: string;
  leaderId?: string;
  region?: string;
  status?: Enums<"participant_status">;
  groupId?: string;
  enrolledFrom?: string;
  enrolledTo?: string;
};

function displayName(row: Pick<ParticipantRow, "full_name" | "anonymized_at">) {
  return row.anonymized_at ? "Participante removida (LGPD)" : row.full_name;
}

export async function listParticipants(filters: ParticipantFilters = {}) {
  const supabase = await createClient();

  let query = supabase
    .from("participants")
    .select(
      "*, leader:leaders!participants_current_leader_id_fkey(id, profile:profiles(full_name)), group:groups!participants_current_group_id_fkey(id, name)",
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (filters.search) {
    query = query.ilike("full_name", `%${filters.search}%`);
  }
  if (filters.leaderId) {
    query = query.eq("current_leader_id", filters.leaderId);
  }
  if (filters.region) {
    query = query.or(`city.ilike.%${filters.region}%,neighborhood.ilike.%${filters.region}%`);
  }
  if (filters.status) {
    query = query.eq("status", filters.status);
  }
  if (filters.groupId) {
    query = query.eq("current_group_id", filters.groupId);
  }
  if (filters.enrolledFrom) {
    query = query.gte("enrollment_date", filters.enrolledFrom);
  }
  if (filters.enrolledTo) {
    query = query.lte("enrollment_date", filters.enrolledTo);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    ...row,
    full_name: displayName(row),
    leader: row.leader ? { id: row.leader.id, full_name: row.leader.profile?.full_name ?? "" } : null,
    group: row.group,
  }));
}

export async function getParticipant(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("participants")
    .select(
      "*, leader:leaders!participants_current_leader_id_fkey(id, profile:profiles(full_name)), group:groups!participants_current_group_id_fkey(id, name), account:profiles!participants_profile_id_fkey(email)",
    )
    .eq("id", id)
    .single();

  if (error) return null;
  return {
    ...data,
    full_name: displayName(data),
    leader: data.leader ? { id: data.leader.id, full_name: data.leader.profile?.full_name ?? "" } : null,
    group: data.group,
  };
}

export type TimelineEntry = {
  id: string;
  date: string;
  kind: "status" | "leader";
  description: string;
};

export async function getParticipantTimeline(id: string): Promise<TimelineEntry[]> {
  const supabase = await createClient();

  const [statusHistory, leaderHistory] = await Promise.all([
    supabase
      .from("participant_status_history")
      .select("id, status, note, created_at")
      .eq("participant_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("participant_leader_history")
      .select("id, start_date, end_date, reason, leader:leaders(id, profile:profiles(full_name))")
      .eq("participant_id", id)
      .order("start_date", { ascending: true }),
  ]);

  const entries: TimelineEntry[] = [];

  for (const row of statusHistory.data ?? []) {
    entries.push({
      id: `status-${row.id}`,
      date: row.created_at,
      kind: "status",
      description: `Status alterado para "${row.status}"${row.note ? ` — ${row.note}` : ""}`,
    });
  }

  for (const row of leaderHistory.data ?? []) {
    const leaderName = row.leader?.profile?.full_name ?? "líder removida";
    entries.push({
      id: `leader-start-${row.id}`,
      date: row.start_date,
      kind: "leader",
      description: `Distribuída para ${leaderName}`,
    });
    if (row.end_date) {
      entries.push({
        id: `leader-end-${row.id}`,
        date: row.end_date,
        kind: "leader",
        description: `Encerrado o vínculo com ${leaderName}${row.reason ? ` — ${row.reason}` : ""}`,
      });
    }
  }

  return entries.sort((a, b) => a.date.localeCompare(b.date));
}

export async function createParticipant(input: ParticipantCreateInput) {
  const supabase = await createClient();

  const {
    consent_accepted,
    availability_days,
    availability_period,
    email,
    ...rest
  } = input;

  const payload: TablesInsert<"participants"> = {
    ...rest,
    email: email || null,
    availability_days: availability_days ?? null,
    availability_period: availability_period ?? null,
    status: "nova_inscricao",
    consent_accepted_at: consent_accepted ? new Date().toISOString() : null,
  };

  // consent_version referencia a versão vigente do termo no momento do cadastro
  const { data: terms } = await supabase
    .from("app_terms_versions")
    .select("version")
    .order("published_at", { ascending: false })
    .limit(1)
    .single();
  payload.consent_version = terms?.version ?? null;

  const { data, error } = await supabase.from("participants").insert(payload).select().single();
  if (error) throw new Error(error.message);

  await logAuditEvent({
    action: "participant.create",
    entity: "participants",
    entityId: data.id,
    after: { full_name: data.full_name, status: data.status },
  });

  return data;
}

export async function updateParticipantPersonal(id: string, input: ParticipantPersonalInput) {
  const supabase = await createClient();
  const { email, ...rest } = input;

  const { data, error } = await supabase
    .from("participants")
    .update({ ...rest, email: email || null })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  await logAuditEvent({
    action: "participant.update",
    entity: "participants",
    entityId: id,
    after: { fields: Object.keys(input) },
  });

  return data;
}

export async function updateParticipantAdminFields(
  id: string,
  input: { admin_notes?: string | null; enrollment_source?: string | null },
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("participants")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  await logAuditEvent({
    action: "participant.update_admin_fields",
    entity: "participants",
    entityId: id,
    after: { fields: Object.keys(input) },
  });

  return data;
}

export async function changeParticipantStatus(
  id: string,
  status: Enums<"participant_status">,
  note: string | null,
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error: historyError } = await supabase.from("participant_status_history").insert({
    participant_id: id,
    status,
    note,
    changed_by: user?.id ?? null,
  });
  if (historyError) throw new Error(historyError.message);

  const { data, error } = await supabase
    .from("participants")
    .update({ status })
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);

  await logAuditEvent({
    action: "participant.status_change",
    entity: "participants",
    entityId: id,
    after: { status, note },
  });

  return data;
}

// Versão simples (pré-Fase 4): só troca o ponteiro current_leader_id, sem
// abrir/fechar registro em participant_leader_history — isso é o motor
// completo de transferência da Fase 4.
// Leitura mínima para popular selects (filtro por líder, "editar líder
// atual"). O CRUD completo de líderes é escopo da Fase 3.
export async function listActiveLeadersForSelect() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leaders")
    .select("id, profile:profiles(full_name)")
    .eq("status", "ativa")
    .order("id");

  if (error) throw new Error(error.message);
  return (data ?? []).map((l) => ({ id: l.id, full_name: l.profile?.full_name ?? "" }));
}

// Histórico de vínculos da líder atual (participantes que são ou já foram
// dela) — usado na tela "Histórico" do perfil da líder.
export async function getLeaderAssignmentHistory(leaderId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("participant_leader_history")
    .select("id, start_date, end_date, reason, participant:participants(id, full_name, anonymized_at)")
    .eq("leader_id", leaderId)
    .order("start_date", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    ...row,
    participant: row.participant
      ? {
          id: row.participant.id,
          full_name: row.participant.anonymized_at ? "Participante removida (LGPD)" : row.participant.full_name,
        }
      : null,
  }));
}

export async function listGroupsForSelect() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("groups").select("id, name").order("name");
  if (error) throw new Error(error.message);
  return data ?? [];
}

// ── Acesso próprio da participante ──────────────────────────────────────

// A própria participante cria o acesso: informa o e-mail que já está no
// cadastro dela (feito pela admin/líder no momento da inscrição) e uma
// senha à sua escolha. O e-mail é o elo que garante que só quem tem um
// cadastro de participante existente consegue criar login — por isso a
// busca abaixo, não um formulário onde a admin digita o e-mail por ela.
// Usa service_role — só chame a partir de uma Server Action pública que
// não pede papel nenhum (é a própria participante, ainda sem login).
export async function claimParticipantAccount(email: string, password: string) {
  const admin = createAdminClient();

  const { data: participant, error: findError } = await admin
    .from("participants")
    .select("id, full_name, profile_id")
    .ilike("email", email)
    .is("deleted_at", null)
    .is("anonymized_at", null)
    .maybeSingle();
  if (findError) throw new Error(findError.message);
  if (!participant) {
    throw new Error(
      "Não encontramos esse e-mail no nosso cadastro. Confirme com sua líder se o e-mail está certo.",
    );
  }
  if (participant.profile_id) {
    throw new Error("Este e-mail já tem acesso criado. Faça login normalmente.");
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: participant.full_name },
  });
  if (createError || !created.user) {
    throw new Error(createError?.message ?? "Não foi possível criar o acesso.");
  }

  // app_handle_new_user já criou o profile com role 'lider' por padrão;
  // corrige para 'participante' e vincula ao registro existente.
  const { error: roleError } = await admin
    .from("profiles")
    .update({ role: "participante" })
    .eq("id", created.user.id);
  if (roleError) throw new Error(roleError.message);

  const { error: linkError } = await admin
    .from("participants")
    .update({ profile_id: created.user.id })
    .eq("id", participant.id);
  if (linkError) throw new Error(linkError.message);

  await logAuditEvent({
    action: "participant.create_account",
    entity: "participants",
    entityId: participant.id,
    after: { email },
  });
}

export async function getCurrentParticipant() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("participants")
    .select(
      "*, leader:leaders!participants_current_leader_id_fkey(id, profile:profiles(full_name, phone, whatsapp)), group:groups!participants_current_group_id_fkey(id, name, address, meeting_time)",
    )
    .eq("profile_id", user.id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateMyParticipantProfile(id: string, input: ParticipantSelfEditInput) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("participants")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

