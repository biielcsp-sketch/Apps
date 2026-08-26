import "server-only";
import { createClient } from "@/lib/supabase/server";
import { computeAttentionAlerts } from "@/lib/services/followup.service";

export async function getAdminDashboard() {
  const supabase = await createClient();

  const [
    { count: totalParticipants },
    { count: activeParticipants },
    { count: awaitingDistribution },
    { count: activeLeaders },
    { data: monthMeetings },
    { data: attendanceAll },
    { data: participantsForAlerts },
    { data: byRegionRaw },
    { data: byLeaderRaw },
    { data: groups },
    { data: enrollmentsRaw },
  ] = await Promise.all([
    supabase.from("participants").select("*", { count: "exact", head: true }).is("deleted_at", null),
    supabase.from("participants").select("*", { count: "exact", head: true }).eq("status", "ativa"),
    supabase.from("participants").select("*", { count: "exact", head: true }).eq("status", "aguardando_distribuicao"),
    supabase.from("leaders").select("*", { count: "exact", head: true }).eq("status", "ativa"),
    supabase
      .from("meetings")
      .select("id, date")
      .gte("date", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)),
    supabase.from("attendance").select("status").neq("status", "nao_informado"),
    supabase.from("participants").select("id, status").in("status", ["distribuida", "ativa", "acompanhamento"]),
    supabase.from("participants").select("city").is("deleted_at", null),
    supabase
      .from("participants")
      .select("current_leader_id, leader:leaders(profile:profiles(full_name))")
      .not("current_leader_id", "is", null),
    supabase.from("groups").select("id, name, capacity, occupants:participants!participants_current_group_id_fkey(count)"),
    supabase.from("participants").select("enrollment_date").is("deleted_at", null),
  ]);

  const totalAttendance = attendanceAll?.length ?? 0;
  const presentCount = attendanceAll?.filter((a) => a.status === "presente").length ?? 0;
  const averageAttendance = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : null;

  const alertsMap = await computeAttentionAlerts(
    (participantsForAlerts ?? []).map((p) => ({ id: p.id, status: p.status })),
  );
  const needingAttention = [...alertsMap.values()].filter(
    (a) => a.precisaContato || a.acompanhamentoNecessario || a.semAcompanhamentoRecente,
  ).length;

  const byRegion = countBy(byRegionRaw ?? [], (r) => r.city || "Não informado");
  const byLeader = countBy(byLeaderRaw ?? [], (r) => r.leader?.profile?.full_name || "Sem líder");
  const byGroup = (groups ?? []).map((g) => ({
    name: g.name,
    occupied: g.occupants?.[0]?.count ?? 0,
    capacity: g.capacity,
  }));

  const monthlyEvolution = monthlyCount(enrollmentsRaw?.map((e) => e.enrollment_date) ?? []);
  const attendanceBreakdown = countBy(attendanceAll ?? [], (a) => a.status);

  return {
    totalParticipants: totalParticipants ?? 0,
    activeParticipants: activeParticipants ?? 0,
    awaitingDistribution: awaitingDistribution ?? 0,
    activeLeaders: activeLeaders ?? 0,
    meetingsThisMonth: monthMeetings?.length ?? 0,
    averageAttendance,
    needingAttention,
    byRegion,
    byLeader,
    byGroup,
    monthlyEvolution,
    attendanceBreakdown,
  };
}

export async function getLeaderDashboard(leaderId: string) {
  const supabase = await createClient();

  const { data: myParticipants } = await supabase
    .from("participants")
    .select("id, status")
    .eq("current_leader_id", leaderId)
    .is("deleted_at", null);

  const { data: lastMeeting } = await supabase
    .from("meetings")
    .select("id, title, date")
    .eq("leader_id", leaderId)
    .lte("date", new Date().toISOString().slice(0, 10))
    .order("date", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: nextMeeting } = await supabase
    .from("meetings")
    .select("id, title, date, time, location")
    .eq("leader_id", leaderId)
    .gt("date", new Date().toISOString().slice(0, 10))
    .order("date", { ascending: true })
    .limit(1)
    .maybeSingle();

  let lastMeetingSummary: { presentes: number; ausentes: number } | null = null;
  if (lastMeeting) {
    const { data: attendance } = await supabase
      .from("attendance")
      .select("status")
      .eq("meeting_id", lastMeeting.id);
    lastMeetingSummary = {
      presentes: attendance?.filter((a) => a.status === "presente").length ?? 0,
      ausentes: attendance?.filter((a) => a.status === "ausente").length ?? 0,
    };
  }

  const alertsMap = await computeAttentionAlerts(
    (myParticipants ?? []).map((p) => ({ id: p.id, status: p.status })),
  );
  const needingAttention = [...alertsMap.values()].filter(
    (a) => a.precisaContato || a.acompanhamentoNecessario,
  ).length;

  return {
    participantCount: myParticipants?.length ?? 0,
    lastMeeting,
    lastMeetingSummary,
    nextMeeting,
    needingAttention,
  };
}

function countBy<T>(items: T[], keyFn: (item: T) => string) {
  const map = new Map<string, number>();
  for (const item of items) {
    const key = keyFn(item);
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
}

function monthlyCount(dates: string[]) {
  const now = new Date();
  const months: { label: string; key: string; count: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    months.push({ label: d.toLocaleDateString("pt-BR", { month: "short" }), key, count: 0 });
  }
  for (const date of dates) {
    const key = date.slice(0, 7);
    const month = months.find((m) => m.key === key);
    if (month) month.count++;
  }
  return months;
}
