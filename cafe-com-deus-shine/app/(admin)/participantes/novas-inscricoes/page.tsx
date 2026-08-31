import { listNewEnrollmentsForReview } from "@/lib/services/enrollment-review.service";
import { listActiveLeadersForSelect } from "@/lib/services/participants.service";
import { EnrollmentReviewBoard } from "@/components/novas-inscricoes/enrollment-review-board";
import { BackLink } from "@/components/ui/BackLink";

export default async function NovasInscricoesPage() {
  const [{ ready, needsAttention }, allLeaders] = await Promise.all([
    listNewEnrollmentsForReview(),
    listActiveLeadersForSelect(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <BackLink href="/participantes" label="Participantes" />
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Novas inscrições</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {ready.length + needsAttention.length} inscrição(ões) aguardando revisão — {ready.length}{" "}
          pronta(s) para aprovar, {needsAttention.length} precisam de atenção.
        </p>
      </div>

      <EnrollmentReviewBoard ready={ready} needsAttention={needsAttention} allLeaders={allLeaders} />
    </div>
  );
}
