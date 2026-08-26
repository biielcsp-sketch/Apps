"use client";

import { confirmDistributionAction } from "@/app/actions/distribution";
import { Button } from "@/components/ui/Button";

const inputClass =
  "w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary";

export function ManualLeaderForm({
  participantId,
  leaders,
}: {
  participantId: string;
  leaders: { id: string; full_name: string }[];
}) {
  const action = confirmDistributionAction.bind(null, participantId);

  return (
    <form action={action} className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
      <p className="text-sm font-semibold text-foreground">Ou escolha manualmente qualquer líder</p>
      <select name="leader_id" required className={inputClass}>
        <option value="">Selecione...</option>
        {leaders.map((l) => (
          <option key={l.id} value={l.id}>{l.full_name}</option>
        ))}
      </select>
      <input type="hidden" name="group_id" value="" />
      <Button type="submit" variant="secondary" className="self-start">
        Confirmar distribuição
      </Button>
    </form>
  );
}
