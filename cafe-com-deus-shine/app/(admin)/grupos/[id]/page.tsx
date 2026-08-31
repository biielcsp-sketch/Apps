import { notFound } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { BackLink } from "@/components/ui/BackLink";
import { getGroup } from "@/lib/services/groups.service";
import { listActiveLeadersForSelect, listParticipants } from "@/lib/services/participants.service";
import { GroupForm } from "@/components/grupos/group-form";
import { ParticipantsTable } from "@/components/participantes/participants-table";

export default async function GrupoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [group, leaders, participants] = await Promise.all([
    getGroup(id),
    listActiveLeadersForSelect(),
    listParticipants({ groupId: id }),
  ]);
  if (!group) notFound();

  return (
    <div>
      <BackLink href="/grupos" label="Grupos" />
      <h1 className="mt-3 text-2xl font-semibold text-foreground">{group.name}</h1>
      <Card className="mt-4 p-6">
        <GroupForm group={group} leaders={leaders} />
      </Card>

      <div className="mt-6">
        <p className="mb-3 text-sm font-semibold text-foreground">
          Participantes do grupo ({participants.length})
        </p>
        <ParticipantsTable participants={participants} basePath="/participantes" />
      </div>
    </div>
  );
}
