import { listParticipants } from "@/lib/services/participants.service";
import { ParticipantsFilters } from "@/components/participantes/participants-filters";
import { ParticipantsTable } from "@/components/participantes/participants-table";
import { computeAttentionAlerts } from "@/lib/services/followup.service";
import { BackLink } from "@/components/ui/BackLink";
import type { Enums } from "@/types/database.types";

type SearchParams = { search?: string; status?: string };

export default async function MinhasParticipantesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const participants = await listParticipants({
    search: params.search,
    status: params.status as Enums<"participant_status"> | undefined,
  });
  const alertsMap = await computeAttentionAlerts(
    participants.map((p) => ({ id: p.id, status: p.status })),
  );

  return (
    <div>
      <BackLink href="/inicio" label="Início" />
      <h1 className="mt-3 text-2xl font-semibold text-foreground">Minhas participantes</h1>
      <p className="mt-1 text-sm text-muted-foreground">{participants.length} participantes</p>

      <div className="mt-4">
        <ParticipantsFilters variant="lider" defaults={params} />
      </div>

      <div className="mt-4">
        <ParticipantsTable participants={participants} basePath="/minhas-participantes" alertsMap={alertsMap} />
      </div>
    </div>
  );
}
