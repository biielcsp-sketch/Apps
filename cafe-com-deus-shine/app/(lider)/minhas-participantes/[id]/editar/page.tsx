import { notFound } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { getParticipant } from "@/lib/services/participants.service";
import { ParticipantEditForm } from "@/components/participantes/participant-edit-form";
import { BackLink } from "@/components/ui/BackLink";

export default async function EditarMinhaParticipantePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const participant = await getParticipant(id);
  if (!participant || participant.anonymized_at) notFound();

  return (
    <div>
      <BackLink href={`/minhas-participantes/${id}`} label={participant.full_name} />
      <h1 className="mt-3 text-2xl font-semibold text-foreground">Editar participante</h1>
      <Card className="mt-4 p-6">
        <ParticipantEditForm participant={participant} isLeaderRoute />
      </Card>
    </div>
  );
}
