import { Card } from "@/components/ui/Card";
import { GroupForm } from "@/components/grupos/group-form";
import { BackLink } from "@/components/ui/BackLink";
import { listHostsForSelect } from "@/lib/services/leaders.service";
import { listActiveLeadersForSelect } from "@/lib/services/participants.service";

export default async function NovoGrupoPage() {
  const [leaders, hosts] = await Promise.all([
    listActiveLeadersForSelect(),
    listHostsForSelect(),
  ]);

  return (
    <div>
      <BackLink href="/cafes?tab=grupos" label="Cafés" />
      <h1 className="mt-3 text-2xl font-semibold text-foreground">Novo grupo</h1>
      <Card className="mt-4 p-6">
        <GroupForm leaders={leaders} hosts={hosts} />
      </Card>
    </div>
  );
}
