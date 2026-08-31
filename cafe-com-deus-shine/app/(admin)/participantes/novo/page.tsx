import { Card } from "@/components/ui/Card";
import { ParticipantCreateForm } from "@/components/participantes/participant-create-form";
import { BackLink } from "@/components/ui/BackLink";

export default function NovaParticipantePage() {
  return (
    <div>
      <BackLink href="/participantes" label="Participantes" />
      <h1 className="mt-3 text-2xl font-semibold text-foreground">Nova participante</h1>
      <Card className="mt-4 p-6">
        <ParticipantCreateForm />
      </Card>
    </div>
  );
}
