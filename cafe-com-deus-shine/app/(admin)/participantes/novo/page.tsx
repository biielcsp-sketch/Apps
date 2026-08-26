import { Card } from "@/components/ui/Card";
import { ParticipantCreateForm } from "@/components/participantes/participant-create-form";
import { getActiveTerms } from "@/lib/services/consent.service";

export default async function NovaParticipantePage() {
  const terms = await getActiveTerms();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Nova participante</h1>
      <Card className="mt-4 p-6">
        <ParticipantCreateForm termsContent={terms.content} />
      </Card>
    </div>
  );
}
