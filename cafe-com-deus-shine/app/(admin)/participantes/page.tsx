import Link from "next/link";
import { Plus } from "lucide-react";
import {
  listParticipants,
  listActiveLeadersForSelect,
  listGroupsForSelect,
} from "@/lib/services/participants.service";
import { ParticipantsFilters } from "@/components/participantes/participants-filters";
import { ParticipantsTable } from "@/components/participantes/participants-table";
import { computeAttentionAlerts } from "@/lib/services/followup.service";
import { PageHeader } from "@/components/ui/PageHeader";
import { BackLink } from "@/components/ui/BackLink";
import type { Enums } from "@/types/database.types";

type SearchParams = {
  search?: string;
  leaderId?: string;
  region?: string;
  status?: string;
  groupId?: string;
  enrolledFrom?: string;
  enrolledTo?: string;
};

export default async function ParticipantesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const [participants, leaders, groups] = await Promise.all([
    listParticipants({
      search: params.search,
      leaderId: params.leaderId,
      region: params.region,
      status: params.status as Enums<"participant_status"> | undefined,
      groupId: params.groupId,
      enrolledFrom: params.enrolledFrom,
      enrolledTo: params.enrolledTo,
    }),
    listActiveLeadersForSelect(),
    listGroupsForSelect(),
  ]);
  const alertsMap = await computeAttentionAlerts(
    participants.map((p) => ({ id: p.id, status: p.status })),
  );

  return (
    <div>
      <BackLink href="/dashboard" label="Dashboard" />
      <PageHeader title="Participantes" description={`${participants.length} encontradas`}>
        <Link
          href="/participantes/novo"
          className="flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
        >
          <Plus size={16} />
          Nova participante
        </Link>
        <div className="flex items-center justify-center gap-4 sm:gap-3">
          <Link
            href="/participantes/novas-inscricoes"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Novas inscrições
          </Link>
          <Link
            href="/participantes/aguardando-distribuicao"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Aguardando distribuição
          </Link>
          <Link
            href="/participantes/solicitacoes-exclusao"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Solicitações de exclusão
          </Link>
        </div>
      </PageHeader>

      <div className="mt-4">
        <ParticipantsFilters variant="admin" leaders={leaders} groups={groups} defaults={params} />
      </div>

      <div className="mt-4">
        <ParticipantsTable participants={participants} basePath="/participantes" alertsMap={alertsMap} />
      </div>
    </div>
  );
}
