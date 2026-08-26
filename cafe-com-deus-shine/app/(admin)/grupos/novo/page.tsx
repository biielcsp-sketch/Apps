import { Card } from "@/components/ui/Card";
import { GroupForm } from "@/components/grupos/group-form";
import { listActiveLeadersForSelect } from "@/lib/services/participants.service";

export default async function NovoGrupoPage() {
  const leaders = await listActiveLeadersForSelect();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Novo grupo</h1>
      <Card className="mt-4 p-6">
        <GroupForm leaders={leaders} />
      </Card>
    </div>
  );
}
