import { Card } from "@/components/ui/Card";
import { ParticipantCreateForm } from "@/components/participantes/participant-create-form";

export default function NovaParticipantePage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Nova participante</h1>
      <Card className="mt-4 p-6">
        <ParticipantCreateForm />
      </Card>
    </div>
  );
}
