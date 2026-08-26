import type { ParticipantAlerts } from "@/lib/services/followup.service";

const CONFIG: { key: keyof ParticipantAlerts; label: string; className: string }[] = [
  { key: "acompanhamentoNecessario", label: "Acompanhamento necessário", className: "bg-danger/15 text-danger" },
  { key: "precisaContato", label: "Precisa de contato", className: "bg-accent/30 text-foreground" },
  { key: "semAcompanhamentoRecente", label: "Sem acompanhamento recente", className: "bg-muted text-muted-foreground" },
];

export function AttentionBadge({ alerts }: { alerts?: ParticipantAlerts }) {
  if (!alerts) return null;
  const active = CONFIG.filter((c) => alerts[c.key]);
  if (active.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1">
      {active.map((a) => (
        <span key={a.key} className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${a.className}`}>
          {a.label}
        </span>
      ))}
    </div>
  );
}
