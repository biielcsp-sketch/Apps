import Link from "next/link";
import { Plus } from "lucide-react";
import { listGroups } from "@/lib/services/groups.service";
import { GroupsList } from "@/components/grupos/groups-list";

export default async function GruposPage() {
  const groups = await listGroups();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Grupos</h1>
        <Link
          href="/grupos/novo"
          className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
        >
          <Plus size={16} />
          Novo grupo
        </Link>
      </div>
      <div className="mt-4">
        <GroupsList groups={groups} />
      </div>
    </div>
  );
}
