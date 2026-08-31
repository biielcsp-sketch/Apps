import Link from "next/link";
import { Plus } from "lucide-react";
import { listGroups } from "@/lib/services/groups.service";
import { listActiveLeadersForSelect } from "@/lib/services/participants.service";
import { GroupsList } from "@/components/grupos/groups-list";
import { GroupsFilters } from "@/components/grupos/groups-filters";
import { PageHeader } from "@/components/ui/PageHeader";
import type { Enums } from "@/types/database.types";

type SearchParams = {
  search?: string;
  status?: string;
  leaderId?: string;
  region?: string;
  createdFrom?: string;
  createdTo?: string;
};

export default async function GruposPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const [groups, leaders] = await Promise.all([
    listGroups({
      search: params.search,
      status: params.status as Enums<"group_status"> | undefined,
      leaderId: params.leaderId,
      region: params.region,
      createdFrom: params.createdFrom,
      createdTo: params.createdTo,
    }),
    listActiveLeadersForSelect(),
  ]);

  return (
    <div>
      <PageHeader title="Grupos" description={`${groups.length} encontrados`}>
        <Link
          href="/grupos/novo"
          className="flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
        >
          <Plus size={16} />
          Novo grupo
        </Link>
      </PageHeader>
      <div className="mt-4">
        <GroupsFilters leaders={leaders} defaults={params} />
      </div>
      <div className="mt-4">
        <GroupsList groups={groups} />
      </div>
    </div>
  );
}
