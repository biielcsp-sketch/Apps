import { notFound } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { getCurrentParticipant } from "@/lib/services/participants.service";
import { SelfEditForm } from "@/components/participantes/self-edit-form";

export default async function EditarMeusDadosPage() {
  const participant = await getCurrentParticipant();
  if (!participant) notFound();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Editar meus dados</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Você pode atualizar telefone, WhatsApp, endereço e disponibilidade. Para alterar outras
        informações, fale com sua líder.
      </p>
      <Card className="mt-4 p-6">
        <SelfEditForm participant={participant} />
      </Card>
    </div>
  );
}
