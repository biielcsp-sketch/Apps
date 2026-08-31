import Link from "next/link";
import { Plus } from "lucide-react";
import { listMeetings } from "@/lib/services/meetings.service";
import { listActiveLeadersForSelect, listGroupsForSelect } from "@/lib/services/participants.service";
import { MeetingsList } from "@/components/encontros/meetings-list";
import { MeetingsFilters } from "@/components/encontros/meetings-filters";
import { PageHeader } from "@/components/ui/PageHeader";
import type { Enums } from "@/types/database.types";

type SearchParams = {
  search?: string;
  status?: string;
  leaderId?: string;
  groupId?: string;
  location?: string;
  dateFrom?: string;
  dateTo?: string;
};

export default async function EncontrosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const [meetings, leaders, groups] = await Promise.all([
    listMeetings({
      search: params.search,
      status: params.status as Enums<"meeting_status"> | undefined,
      leaderId: params.leaderId,
      groupId: params.groupId,
      location: params.location,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
    }),
    listActiveLeadersForSelect(),
    listGroupsForSelect(),
  ]);

  return (
    <div>
      <PageHeader title="Encontros" description={`${meetings.length} encontrados`}>
        <Link
          href="/encontros/novo"
          className="flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
        >
          <Plus size={16} />
          Novo encontro
        </Link>
      </PageHeader>
      <div className="mt-4">
        <MeetingsFilters leaders={leaders} groups={groups} defaults={params} />
      </div>
      <div className="mt-4">
        <MeetingsList meetings={meetings} basePath="/encontros" />
      </div>
    </div>
  );
}
