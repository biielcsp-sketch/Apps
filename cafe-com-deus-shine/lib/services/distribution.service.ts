import "server-only";
import { createClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/services/audit.service";

export type DistributionWeights = {
  disponibilidade: number;
  proximidade: number;
  capacidade: number;
  equilibrio: number;
  preferencias: number;
};

const DEFAULT_WEIGHTS: DistributionWeights = {
  disponibilidade: 40,
  proximidade: 25,
  capacidade: 15,
  equilibrio: 10,
  preferencias: 10,
};

export async function getDistributionWeights(): Promise<DistributionWeights> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("app_config")
    .select("value")
    .eq("key", "distribution_weights")
    .maybeSingle();

  if (data?.value) return data.value as unknown as DistributionWeights;

  await supabase
    .from("app_config")
    .insert({ key: "distribution_weights", value: DEFAULT_WEIGHTS })
    .select()
    .maybeSingle();

  return DEFAULT_WEIGHTS;
}

// Função pura de distância — sem dependência externa (Prompt 4).
export function haversineDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function timeToPeriod(time: string | null): "manha" | "tarde" | "noite" | null {
  if (!time) return null;
  const hour = Number(time.split(":")[0]);
  if (Number.isNaN(hour)) return null;
  if (hour < 12) return "manha";
  if (hour < 18) return "tarde";
  return "noite";
}

export async function listAwaitingDistribution() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("participants")
    .select("id, full_name, city, neighborhood, enrollment_date")
    .eq("status", "aguardando_distribuicao")
    .order("enrollment_date", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export type LeaderSuggestion = {
  leaderId: string;
  leaderName: string;
  groupId: string | null;
  groupName: string | null;
  score: number;
  breakdown: {
    criterio: string;
    peso: number;
    valor: number; // 0-1 antes do peso
    pontos: number;
  }[];
};

export async function suggestLeaders(participantId: string): Promise<{
  participant: { id: string; full_name: string };
  suggestions: LeaderSuggestion[];
  eligibleCount: number;
}> {
  const supabase = await createClient();
  const weights = await getDistributionWeights();

  const { data: participant, error: participantError } = await supabase
    .from("participants")
    .select("id, full_name, city, neighborhood, availability_days, availability_period, location_preference")
    .eq("id", participantId)
    .single();
  if (participantError || !participant) throw new Error("Participante não encontrada.");

  // Filtros obrigatórios: líder ativa com vagas restantes.
  const { data: leaders, error: leadersError } = await supabase
    .from("leaders")
    .select(
      "id, city, neighborhood, region, max_capacity, profile:profiles(full_name), occupants:participants!participants_current_leader_id_fkey(count), groups(id, name, status, capacity, available_days, meeting_time, region, occupants:participants!participants_current_group_id_fkey(count))",
    )
    .eq("status", "ativa");
  if (leadersError) throw new Error(leadersError.message);

  const eligible = (leaders ?? [])
    .map((l) => ({ ...l, occupied: l.occupants?.[0]?.count ?? 0 }))
    .filter((l) => l.occupied < l.max_capacity);

  // Média de participantes por grupo ativo — para o critério de equilíbrio.
  const activeGroups = eligible.flatMap((l) => (l.groups ?? []).filter((g) => g.status === "ativo"));
  const avgPerGroup =
    activeGroups.length > 0
      ? activeGroups.reduce((sum, g) => sum + (g.occupants?.[0]?.count ?? 0), 0) / activeGroups.length
      : 0;

  const participantDays = participant.availability_days ?? [];
  const participantPeriods = participant.availability_period ?? [];

  const suggestions: LeaderSuggestion[] = eligible.map((leader) => {
    const primaryGroup = (leader.groups ?? []).find((g) => g.status === "ativo") ?? null;

    // 1. Disponibilidade (dias + período do grupo, se houver)
    let disponibilidade = 0.5; // neutro quando não há grupo pra comparar
    if (primaryGroup) {
      const groupDays = primaryGroup.available_days ?? [];
      const overlap = participantDays.filter((d) => groupDays.includes(d)).length;
      const dayScore = participantDays.length > 0 ? overlap / participantDays.length : 0.5;
      const groupPeriod = timeToPeriod(primaryGroup.meeting_time);
      const periodScore =
        participantPeriods.length > 0 && groupPeriod
          ? participantPeriods.includes(groupPeriod)
            ? 1
            : 0
          : 0.5;
      disponibilidade = (dayScore + periodScore) / 2;
    }

    // 2. Proximidade — sem geo_lat/lng em leaders/groups neste schema,
    // usa sempre a comparação textual (fallback já previsto na arquitetura).
    let proximidade = 0;
    if (participant.neighborhood && leader.neighborhood && participant.neighborhood.toLowerCase() === leader.neighborhood.toLowerCase()) {
      proximidade = 1;
    } else if (participant.city && leader.city && participant.city.toLowerCase() === leader.city.toLowerCase()) {
      proximidade = 0.5;
    }

    // 3. Capacidade da líder
    const capacidade = (leader.max_capacity - leader.occupied) / leader.max_capacity;

    // 4. Equilíbrio entre grupos
    let equilibrio = 0.5;
    if (primaryGroup && avgPerGroup > 0) {
      const occupied = primaryGroup.occupants?.[0]?.count ?? 0;
      equilibrio = Math.max(0, Math.min(1, 1 - occupied / avgPerGroup));
    }

    // 5. Preferências cadastradas
    let preferencias = 0;
    const pref = participant.location_preference?.toLowerCase().trim();
    const region = leader.region?.toLowerCase().trim();
    if (pref && region) {
      if (pref === region) preferencias = 1;
      else if (region.includes(pref) || pref.includes(region)) preferencias = 0.5;
    }

    const breakdown = [
      { criterio: "Disponibilidade", peso: weights.disponibilidade, valor: disponibilidade, pontos: disponibilidade * weights.disponibilidade },
      { criterio: "Proximidade geográfica", peso: weights.proximidade, valor: proximidade, pontos: proximidade * weights.proximidade },
      { criterio: "Capacidade da líder", peso: weights.capacidade, valor: capacidade, pontos: capacidade * weights.capacidade },
      { criterio: "Equilíbrio entre grupos", peso: weights.equilibrio, valor: equilibrio, pontos: equilibrio * weights.equilibrio },
      { criterio: "Preferências cadastradas", peso: weights.preferencias, valor: preferencias, pontos: preferencias * weights.preferencias },
    ];

    return {
      leaderId: leader.id,
      leaderName: leader.profile?.full_name ?? "—",
      groupId: primaryGroup?.id ?? null,
      groupName: primaryGroup?.name ?? null,
      score: breakdown.reduce((sum, b) => sum + b.pontos, 0),
      breakdown,
    };
  });

  suggestions.sort((a, b) => b.score - a.score);

  return {
    participant: { id: participant.id, full_name: participant.full_name },
    suggestions: suggestions.slice(0, 3),
    eligibleCount: eligible.length,
  };
}

export async function confirmDistribution(
  participantId: string,
  leaderId: string,
  groupId: string | null,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Defensivo: nunca deixa dois registros abertos para a mesma participante.
  await supabase
    .from("participant_leader_history")
    .update({ end_date: new Date().toISOString().slice(0, 10) })
    .eq("participant_id", participantId)
    .is("end_date", null);

  const { error: historyError } = await supabase.from("participant_leader_history").insert({
    participant_id: participantId,
    leader_id: leaderId,
    group_id: groupId,
    changed_by: user?.id ?? null,
  });
  if (historyError) throw new Error(historyError.message);

  const { error: statusHistoryError } = await supabase.from("participant_status_history").insert({
    participant_id: participantId,
    status: "distribuida",
    changed_by: user?.id ?? null,
  });
  if (statusHistoryError) throw new Error(statusHistoryError.message);

  const { error: updateError } = await supabase
    .from("participants")
    .update({ current_leader_id: leaderId, current_group_id: groupId, status: "distribuida" })
    .eq("id", participantId);
  if (updateError) throw new Error(updateError.message);

  await logAuditEvent({
    action: "participant.distribute",
    entity: "participants",
    entityId: participantId,
    after: { leader_id: leaderId, group_id: groupId },
  });
}
