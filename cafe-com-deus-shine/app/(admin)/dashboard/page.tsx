import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/dashboard/stat-card";
import { BarList } from "@/components/dashboard/bar-list";
import { getAdminDashboard } from "@/lib/services/dashboard.service";

const ATTENDANCE_LABELS: Record<string, string> = {
  presente: "Presentes",
  ausente: "Ausentes",
  justificou: "Justificaram",
};

export default async function DashboardPage() {
  const data = await getAdminDashboard();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Visão geral da comunidade Café com Deus Shine
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label="Participantes" value={data.totalParticipants} />
        <StatCard label="Ativas" value={data.activeParticipants} />
        <StatCard label="Aguardando distribuição" value={data.awaitingDistribution} />
        <StatCard label="Líderes ativas" value={data.activeLeaders} />
        <StatCard label="Encontros no mês" value={data.meetingsThisMonth} />
        <StatCard
          label="Presença média"
          value={data.averageAttendance !== null ? `${data.averageAttendance}%` : "—"}
        />
        <StatCard label="Precisam de acompanhamento" value={data.needingAttention} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <p className="mb-3 text-sm font-semibold text-foreground">Participantes por região</p>
          <BarList items={data.byRegion} />
        </Card>
        <Card className="p-5">
          <p className="mb-3 text-sm font-semibold text-foreground">Participantes por líder</p>
          <BarList items={data.byLeader} />
        </Card>
        <Card className="p-5">
          <p className="mb-3 text-sm font-semibold text-foreground">Ocupação por grupo</p>
          <BarList
            items={data.byGroup.map((g) => ({ label: `${g.name} (${g.occupied}/${g.capacity})`, count: g.occupied }))}
          />
        </Card>
        <Card className="p-5">
          <p className="mb-3 text-sm font-semibold text-foreground">Frequência (geral)</p>
          <BarList
            items={data.attendanceBreakdown
              .filter((a) => ATTENDANCE_LABELS[a.label])
              .map((a) => ({ label: ATTENDANCE_LABELS[a.label], count: a.count }))}
          />
        </Card>
        <Card className="p-5 lg:col-span-2">
          <p className="mb-3 text-sm font-semibold text-foreground">Evolução mensal de inscrições</p>
          <BarList items={data.monthlyEvolution.map((m) => ({ label: m.label, count: m.count }))} />
        </Card>
      </div>
    </div>
  );
}
