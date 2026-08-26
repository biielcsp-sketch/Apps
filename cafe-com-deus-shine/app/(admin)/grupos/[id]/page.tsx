import { notFound } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { getGroup } from "@/lib/services/groups.service";
import { listActiveLeadersForSelect } from "@/lib/services/participants.service";
import { GroupForm } from "@/components/grupos/group-form";

export default async function GrupoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [group, leaders] = await Promise.all([getGroup(id), listActiveLeadersForSelect()]);
  if (!group) notFound();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">{group.name}</h1>
      <Card className="mt-4 p-6">
        <GroupForm group={group} leaders={leaders} />
      </Card>
    </div>
  );
}
