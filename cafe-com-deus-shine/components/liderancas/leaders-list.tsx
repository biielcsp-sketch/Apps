import Link from "next/link";
import type { listLeaders } from "@/lib/services/leaders.service";

type Leader = Awaited<ReturnType<typeof listLeaders>>[number];

export function LeadersList({ leaders }: { leaders: Leader[] }) {
  if (leaders.length === 0) {
    return (
      <p className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
        Nenhuma líder cadastrada ainda.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {leaders.map((l) => {
        const pct = Math.min(100, Math.round((l.occupied / l.max_capacity) * 100));
        return (
          <Link
            key={l.id}
            href={`/liderancas/${l.id}`}
            className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 hover:bg-muted"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-medium text-foreground">{l.full_name}</p>
                {l.status === "inativa" && (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    Inativa
                  </span>
                )}
              </div>
              <p className="truncate text-xs text-muted-foreground">
                {l.city ?? "Cidade não informada"} · {l.region ?? "sem região"}
              </p>
              <div className="mt-2 h-1.5 w-full max-w-40 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">
              {l.occupied}/{l.max_capacity} participantes
            </span>
          </Link>
        );
      })}
    </div>
  );
}
