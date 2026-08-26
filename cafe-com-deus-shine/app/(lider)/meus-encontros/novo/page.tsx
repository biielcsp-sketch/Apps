import { Card } from "@/components/ui/Card";
import { MeetingForm } from "@/components/encontros/meeting-form";
import { listGroups } from "@/lib/services/groups.service";

export default async function NovoEncontroPage() {
  const groups = await listGroups();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Novo encontro</h1>
      <Card className="mt-4 p-6">
        <MeetingForm groups={groups} basePath="/meus-encontros" />
      </Card>
    </div>
  );
}
