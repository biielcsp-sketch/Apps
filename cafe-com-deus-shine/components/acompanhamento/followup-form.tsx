"use client";

import { useActionState } from "react";
import { createFollowUpAction } from "@/app/actions/followups";
import type { FormActionState } from "@/app/actions/participants";
import { FOLLOW_UP_TYPES, FOLLOW_UP_TYPE_LABELS } from "@/lib/validators/followup.schema";
import { Button } from "@/components/ui/Button";

const inputClass =
  "w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary";
const labelClass = "text-sm font-medium text-foreground";

export function FollowUpForm({ participantId, basePath }: { participantId: string; basePath: string }) {
  const action = createFollowUpAction.bind(null, participantId, basePath);
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(action, undefined);

  return (
    <form action={formAction} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-1.5">
        <label className={labelClass} htmlFor="date">Data</label>
        <input id="date" name="date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} className={inputClass} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelClass} htmlFor="type">Tipo</label>
        <select id="type" name="type" required className={inputClass}>
          {FOLLOW_UP_TYPES.map((t) => (
            <option key={t} value={t}>{FOLLOW_UP_TYPE_LABELS[t]}</option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelClass} htmlFor="status">Status</label>
        <select id="status" name="status" defaultValue="normal" className={inputClass}>
          <option value="normal">Normal</option>
          <option value="atencao">Atenção</option>
          <option value="acompanhamento_necessario">Acompanhamento necessário</option>
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelClass} htmlFor="next_follow_up_date">Próximo acompanhamento</label>
        <input id="next_follow_up_date" name="next_follow_up_date" type="date" className={inputClass} />
      </div>
      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <label className={labelClass} htmlFor="observation">Observação</label>
        <textarea id="observation" name="observation" rows={3} className={inputClass} />
      </div>
      <div className="flex items-center pb-1">
        <label className="flex items-center gap-1.5 text-sm text-foreground">
          <input type="checkbox" name="needs_return" />
          Precisa de retorno
        </label>
      </div>
      {state?.error && <p className="text-sm text-danger sm:col-span-2">{state.error}</p>}
      {state?.success && <p className="text-sm text-primary sm:col-span-2">Registrado.</p>}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Salvando..." : "Registrar acompanhamento"}
      </Button>
    </form>
  );
}
