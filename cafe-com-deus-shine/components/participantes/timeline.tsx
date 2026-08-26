import type { TimelineEntry } from "@/lib/services/participants.service";

export function Timeline({ entries }: { entries: TimelineEntry[] }) {
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum evento registrado ainda.</p>;
  }

  return (
    <ol className="flex flex-col gap-3">
      {entries.map((entry) => (
        <li key={entry.id} className="flex gap-3 text-sm">
          <span className="w-24 shrink-0 text-xs text-muted-foreground">
            {new Date(entry.date).toLocaleDateString("pt-BR")}
          </span>
          <span className="text-foreground">{entry.description}</span>
        </li>
      ))}
    </ol>
  );
}
