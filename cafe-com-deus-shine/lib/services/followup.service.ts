import "server-only";
import { createClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/services/audit.service";
import { dbError } from "@/lib/errors";
import type { FollowUpInput } from "@/lib/validators/followup.schema";
import type { Tables, Enums } from "@/types/database.types";

export type FollowUpRow = Tables<"follow_ups">;

const DEFAULT_FOLLOWUP_PERIOD_DAYS = 30;

export async function getFollowUpPeriodDays(): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("app_config")
    .select("value")
    .eq("key", "followup_period_days")
    .maybeSingle();

  if (typeof data?.value === "number") return data.value;

  await supabase
    .from("app_config")
    .insert({ key: "followup_period_days", value: DEFAULT_FOLLOWUP_PERIOD_DAYS })
    .select()
    .maybeSingle();

  return DEFAULT_FOLLOWUP_PERIOD_DAYS;
}

export async function listFollowUps(participantId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("follow_ups")
    .select("*")
    .eq("participant_id", participantId)
    .order("date", { ascending: false });
  if (error) dbError(error, "followup.list");
  return data ?? [];
}

export async function createFollowUp(participantId: string, leaderId: string, input: FollowUpInput) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("follow_ups")
    .insert({
      participant_id: participantId,
      leader_id: leaderId,
      date: input.date,
      type: input.type,
      status: input.status ?? "normal",
      observation: input.observation || null,
      needs_return: input.needs_return ?? false,
      next_follow_up_date: input.next_follow_up_date || null,
    })
    .select()
    .single();
  if (error) dbError(error, "followup.create");

  await logAuditEvent({
    action: "followup.create",
    entity: "follow_ups",
    entityId: data.id,
    after: { participant_id: participantId, type: input.type, status: input.status },
  });
  return data;
}

export type ParticipantAlerts = {
  precisaContato: boolean;
  acompanhamentoNecessario: boolean;
  semAcompanhamentoRecente: boolean;
};

// Alertas do item 12 da especificação — calculados a partir de dados reais
// de presença e acompanhamento (nunca hardcoded).
export async function computeAttentionAlerts(
  participants: { id: string; status: Enums<"participant_status"> }[],
): Promise<Map<string, ParticipantAlerts>> {
  const supabase = await createClient();
  const ids = participants.map((p) => p.id);
  const result = new Map<string, ParticipantAlerts>();
  if (ids.length === 0) return result;

  const periodDays = await getFollowUpPeriodDays();

  const { data: attendanceRows } = await supabase
    .from("attendance")
    .select("participant_id, status, meeting:meetings(date)")
    .in("participant_id", ids)
    .neq("status", "nao_informado");

  const { data: followUpRows } = await supabase
    .from("follow_ups")
    .select("participant_id, date")
    .in("participant_id", ids);

  const attendanceByParticipant = new Map<string, { status: string; date: string }[]>();
  for (const row of attendanceRows ?? []) {
    if (!row.meeting) continue;
    const list = attendanceByParticipant.get(row.participant_id) ?? [];
    list.push({ status: row.status, date: row.meeting.date });
    attendanceByParticipant.set(row.participant_id, list);
  }
  for (const list of attendanceByParticipant.values()) {
    list.sort((a, b) => b.date.localeCompare(a.date));
  }

  const lastFollowUpByParticipant = new Map<string, string>();
  for (const row of followUpRows ?? []) {
    const current = lastFollowUpByParticipant.get(row.participant_id);
    if (!current || row.date > current) lastFollowUpByParticipant.set(row.participant_id, row.date);
  }

  const todayMs = Date.now();

  for (const participant of participants) {
    const history = attendanceByParticipant.get(participant.id) ?? [];
    const precisaContato = history.length > 0 && history[0].status === "ausente";

    let consecutiveAusente = 0;
    for (const entry of history) {
      if (entry.status === "ausente") consecutiveAusente++;
      else break;
    }
    const acompanhamentoNecessario = consecutiveAusente >= 2;

    const lastFollowUp = lastFollowUpByParticipant.get(participant.id);
    const daysSince = lastFollowUp
      ? (todayMs - new Date(lastFollowUp).getTime()) / (1000 * 60 * 60 * 24)
      : Infinity;
    const semAcompanhamentoRecente = participant.status === "ativa" && daysSince > periodDays;

    result.set(participant.id, { precisaContato, acompanhamentoNecessario, semAcompanhamentoRecente });
  }

  return result;
}
