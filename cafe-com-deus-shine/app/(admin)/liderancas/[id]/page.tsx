import { notFound } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { getLeader } from "@/lib/services/leaders.service";
import { listParticipants } from "@/lib/services/participants.service";
import { LeaderEditForm } from "@/components/liderancas/leader-edit-form";
import { ToggleStatusButton } from "@/components/liderancas/toggle-status-button";
import { ParticipantsTable } from "@/components/participantes/participants-table";

export default async function LiderancaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const leader = await getLeader(id);
  if (!leader) notFound();

  const participants = await listParticipants({ leaderId: id });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{leader.profile?.full_name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {leader.profile?.email} · {leader.profile?.phone ?? "sem telefone"}
          </p>
        </div>
        <ToggleStatusButton id={leader.id} status={leader.status} />
      </div>

      <Card className="p-6">
        <p className="mb-4 text-sm font-semibold text-foreground">Dados da liderança</p>
        <LeaderEditForm leader={leader} />
      </Card>

      <div>
        <p className="mb-3 text-sm font-semibold text-foreground">
          Participantes sob responsabilidade ({participants.length})
        </p>
        <ParticipantsTable participants={participants} basePath="/participantes" />
      </div>
    </div>
  );
}
