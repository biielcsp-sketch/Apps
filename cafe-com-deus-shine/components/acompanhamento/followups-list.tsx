import { FOLLOW_UP_TYPE_LABELS } from "@/lib/validators/followup.schema";
import type { FollowUpRow } from "@/lib/services/followup.service";

const STATUS_BADGE: Record<string, string> = {
  normal: "bg-muted text-muted-foreground",
  atencao: "bg-accent/30 text-foreground",
  acompanhamento_necessario: "bg-danger/15 text-danger",
};

export function FollowUpsList({ followUps }: { followUps: FollowUpRow[] }) {
  if (followUps.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum acompanhamento registrado ainda.</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {followUps.map((f) => (
        <li key={f.id} className="rounded-lg border border-border p-3">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <span className="min-w-0 truncate text-sm font-medium text-foreground">
              {new Date(`${f.date}T00:00:00`).toLocaleDateString("pt-BR")} · {FOLLOW_UP_TYPE_LABELS[f.type]}
            </span>
            <span
              className={`self-start rounded-full px-2 py-0.5 text-xs font-medium sm:shrink-0 ${STATUS_BADGE[f.status]}`}
            >
              {f.status === "normal" ? "Normal" : f.status === "atencao" ? "Atenção" : "Acompanhamento necessário"}
            </span>
          </div>
          {f.observation && <p className="mt-1 text-sm text-muted-foreground">{f.observation}</p>}
          {f.next_follow_up_date && (
            <p className="mt-1 text-xs text-muted-foreground">
              Próximo acompanhamento: {new Date(`${f.next_follow_up_date}T00:00:00`).toLocaleDateString("pt-BR")}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
