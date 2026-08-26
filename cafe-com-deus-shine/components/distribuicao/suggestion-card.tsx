"use client";

import { confirmDistributionAction } from "@/app/actions/distribution";
import { Button } from "@/components/ui/Button";
import type { LeaderSuggestion } from "@/lib/services/distribution.service";

export function SuggestionCard({
  participantId,
  suggestion,
  rank,
}: {
  participantId: string;
  suggestion: LeaderSuggestion;
  rank: number;
}) {
  const action = confirmDistributionAction.bind(null, participantId);

  return (
    <form action={action} className="rounded-2xl border border-border bg-card p-5">
      <input type="hidden" name="leader_id" value={suggestion.leaderId} />
      <input type="hidden" name="group_id" value={suggestion.groupId ?? ""} />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            {rank}
          </span>
          <p className="text-sm font-semibold text-foreground">{suggestion.leaderName}</p>
        </div>
        <span className="text-sm font-semibold text-primary">{suggestion.score.toFixed(1)} pts</span>
      </div>
      {suggestion.groupName && (
        <p className="mt-1 text-xs text-muted-foreground">Grupo: {suggestion.groupName}</p>
      )}

      <div className="mt-3 flex flex-col gap-1.5">
        {suggestion.breakdown.map((b) => (
          <div key={b.criterio} className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {b.criterio} (peso {b.peso})
            </span>
            <span className="text-foreground">{b.pontos.toFixed(1)} pts</span>
          </div>
        ))}
      </div>

      <Button type="submit" className="mt-4 w-full" variant={rank === 1 ? "primary" : "secondary"}>
        Escolher esta líder
      </Button>
    </form>
  );
}
