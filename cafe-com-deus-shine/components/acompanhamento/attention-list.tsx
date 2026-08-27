import Link from "next/link";
import { AttentionBadge } from "@/components/acompanhamento/attention-badge";
import type { ParticipantListItem } from "@/lib/services/participants.service";
import type { ParticipantAlerts } from "@/lib/services/followup.service";

export function AttentionList({
  participants,
  alertsMap,
  basePath,
}: {
  participants: ParticipantListItem[];
  alertsMap: Map<string, ParticipantAlerts>;
  basePath: string;
}) {
  const withAlerts = participants
    .map((p) => ({ participant: p, alerts: alertsMap.get(p.id) }))
    .filter(
      (x) =>
        x.alerts &&
        (x.alerts.acompanhamentoNecessario || x.alerts.precisaContato || x.alerts.semAcompanhamentoRecente),
    )
    .sort((a, b) => {
      const score = (al?: ParticipantAlerts) =>
        (al?.acompanhamentoNecessario ? 4 : 0) + (al?.precisaContato ? 2 : 0) + (al?.semAcompanhamentoRecente ? 1 : 0);
      return score(b.alerts) - score(a.alerts);
    });

  if (withAlerts.length === 0) {
    return (
      <p className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
        Nenhuma participante precisa de atenção no momento. 🌷
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {withAlerts.map(({ participant, alerts }) => (
        <Link
          key={participant.id}
          href={`${basePath}/${participant.id}`}
          className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4 hover:bg-muted sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="text-sm font-medium text-foreground">{participant.full_name}</p>
            <p className="text-xs text-muted-foreground">
              {participant.leader?.full_name ?? "sem líder"}
            </p>
          </div>
          <AttentionBadge alerts={alerts} />
        </Link>
      ))}
    </div>
  );
}
