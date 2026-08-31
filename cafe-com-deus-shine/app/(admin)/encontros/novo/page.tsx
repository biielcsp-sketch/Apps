import { Card } from "@/components/ui/Card";
import { MeetingForm } from "@/components/encontros/meeting-form";
import { BackLink } from "@/components/ui/BackLink";
import { listGroups } from "@/lib/services/groups.service";

export default async function NovoEncontroPage() {
  const groups = await listGroups();

  return (
    <div>
      <BackLink href="/encontros" label="Encontros" />
      <h1 className="mt-3 text-2xl font-semibold text-foreground">Novo encontro</h1>
      <Card className="mt-4 p-6">
        <MeetingForm groups={groups} basePath="/encontros" />
      </Card>
    </div>
  );
}
