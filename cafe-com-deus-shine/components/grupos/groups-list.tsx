import Link from "next/link";
import type { listGroups } from "@/lib/services/groups.service";

type Group = Awaited<ReturnType<typeof listGroups>>[number];

const STATUS_LABELS: Record<string, string> = { ativo: "Ativo", inativo: "Inativo", lotado: "Lotado" };

export function GroupsList({ groups }: { groups: Group[] }) {
  if (groups.length === 0) {
    return (
      <p className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
        Nenhum grupo cadastrado ainda.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {groups.map((g) => (
        <Link
          key={g.id}
          href={`/grupos/${g.id}`}
          className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 hover:bg-muted"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{g.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              Líder: {g.leader_name} · {g.region ?? "sem região"}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span className="text-xs text-muted-foreground">
              {g.occupied}/{g.capacity} vagas
            </span>
            <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
              {STATUS_LABELS[g.status]}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
