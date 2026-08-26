import Link from "next/link";
import { PARTICIPANT_STATUS_BADGE, PARTICIPANT_STATUS_LABELS } from "@/lib/participant-status-labels";
import { AttentionBadge } from "@/components/acompanhamento/attention-badge";
import type { ParticipantListItem } from "@/lib/services/participants.service";
import type { ParticipantAlerts } from "@/lib/services/followup.service";

export function ParticipantsTable({
  participants,
  basePath,
  alertsMap,
}: {
  participants: ParticipantListItem[];
  basePath: string;
  alertsMap?: Map<string, ParticipantAlerts>;
}) {
  if (participants.length === 0) {
    return (
      <p className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
        Nenhuma participante encontrada com esses filtros.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {participants.map((p) => (
        <Link
          key={p.id}
          href={`${basePath}/${p.id}`}
          className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 hover:bg-muted"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{p.full_name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {p.leader?.full_name ?? "Sem líder"} · {p.city ?? "Cidade não informada"}
            </p>
            <div className="mt-1">
              <AttentionBadge alerts={alertsMap?.get(p.id)} />
            </div>
          </div>
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${PARTICIPANT_STATUS_BADGE[p.status]}`}
          >
            {PARTICIPANT_STATUS_LABELS[p.status]}
          </span>
        </Link>
      ))}
    </div>
  );
}
