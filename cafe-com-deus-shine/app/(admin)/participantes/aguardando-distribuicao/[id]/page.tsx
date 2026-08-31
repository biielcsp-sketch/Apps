import { suggestLeaders } from "@/lib/services/distribution.service";
import { listActiveLeadersForSelect } from "@/lib/services/participants.service";
import { Card } from "@/components/ui/Card";
import { SuggestionCard } from "@/components/distribuicao/suggestion-card";
import { ManualLeaderForm } from "@/components/distribuicao/manual-leader-form";
import { BackLink } from "@/components/ui/BackLink";

export default async function DistribuirParticipantePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [{ participant, suggestions, eligibleCount }, leaders] = await Promise.all([
    suggestLeaders(id),
    listActiveLeadersForSelect(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <BackLink href="/participantes/aguardando-distribuicao" label="Aguardando distribuição" />
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Distribuir {participant.full_name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {eligibleCount} líder(es) elegível(is) (ativas, com vagas)
        </p>
      </div>

      {eligibleCount === 0 ? (
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">
            Nenhuma líder elegível no momento — todas estão inativas ou sem vagas restantes. Você
            ainda pode aguardar novas vagas ou ativar/ajustar a capacidade de uma líder.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {suggestions.map((s, i) => (
            <SuggestionCard key={s.leaderId} participantId={id} suggestion={s} rank={i + 1} />
          ))}
        </div>
      )}

      <ManualLeaderForm participantId={id} leaders={leaders} />
    </div>
  );
}
