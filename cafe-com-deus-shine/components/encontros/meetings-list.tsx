import Link from "next/link";
import type { listMeetings } from "@/lib/services/meetings.service";

type Meeting = Awaited<ReturnType<typeof listMeetings>>[number];

const STATUS_LABELS: Record<string, string> = {
  planejado: "Planejado",
  confirmado: "Confirmado",
  realizado: "Realizado",
  cancelado: "Cancelado",
};

export function MeetingsList({ meetings, basePath }: { meetings: Meeting[]; basePath: string }) {
  if (meetings.length === 0) {
    return (
      <p className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
        Nenhum encontro cadastrado ainda.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {meetings.map((m) => (
        <Link
          key={m.id}
          href={`${basePath}/${m.id}`}
          className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 hover:bg-muted"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{m.title}</p>
            <p className="truncate text-xs text-muted-foreground">
              {m.group?.name} · {m.leader?.profile?.full_name}
            </p>
            {m.ministered_by && (
              <p className="truncate text-xs text-muted-foreground">
                Palavra: {m.ministered_by}
              </p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span className="text-xs text-muted-foreground">
              {new Date(`${m.date}T00:00:00`).toLocaleDateString("pt-BR")}
              {m.time ? ` · ${m.time.slice(0, 5)}` : ""}
            </span>
            <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
              {STATUS_LABELS[m.status]}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
