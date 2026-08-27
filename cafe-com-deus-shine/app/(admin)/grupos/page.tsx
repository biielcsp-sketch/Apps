import Link from "next/link";
import { Plus } from "lucide-react";
import { listGroups } from "@/lib/services/groups.service";
import { GroupsList } from "@/components/grupos/groups-list";
import { PageHeader } from "@/components/ui/PageHeader";

export default async function GruposPage() {
  const groups = await listGroups();

  return (
    <div>
      <PageHeader title="Grupos">
        <Link
          href="/grupos/novo"
          className="flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
        >
          <Plus size={16} />
          Novo grupo
        </Link>
      </PageHeader>
      <div className="mt-4">
        <GroupsList groups={groups} />
      </div>
    </div>
  );
}
