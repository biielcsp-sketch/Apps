"use client";

import { useActionState } from "react";
import { updateLeaderAction } from "@/app/actions/leaders";
import { Button } from "@/components/ui/Button";
import type { FormActionState } from "@/app/actions/participants";
import type { LeaderRow } from "@/lib/services/leaders.service";

const inputClass =
  "w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary";
const labelClass = "text-sm font-medium text-foreground";

export function LeaderEditForm({ leader }: { leader: LeaderRow }) {
  const boundAction = updateLeaderAction.bind(null, leader.id);
  const [state, action, pending] = useActionState<FormActionState, FormData>(boundAction, undefined);

  return (
    <form action={action} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-1.5">
        <label className={labelClass} htmlFor="city">Cidade</label>
        <input id="city" name="city" defaultValue={leader.city ?? ""} className={inputClass} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelClass} htmlFor="neighborhood">Bairro</label>
        <input id="neighborhood" name="neighborhood" defaultValue={leader.neighborhood ?? ""} className={inputClass} />
      </div>
      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <label className={labelClass} htmlFor="meeting_address">Endereço do encontro</label>
        <input
          id="meeting_address"
          name="meeting_address"
          defaultValue={leader.meeting_address ?? ""}
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelClass} htmlFor="region">Região de atuação</label>
        <input id="region" name="region" defaultValue={leader.region ?? ""} className={inputClass} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelClass} htmlFor="max_capacity">Capacidade máxima</label>
        <input
          id="max_capacity"
          name="max_capacity"
          type="number"
          min={1}
          defaultValue={leader.max_capacity}
          required
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <label className={labelClass} htmlFor="admin_notes">Observações administrativas</label>
        <textarea
          id="admin_notes"
          name="admin_notes"
          rows={3}
          defaultValue={leader.admin_notes ?? ""}
          className={inputClass}
        />
      </div>
      {state?.error && <p className="text-sm text-danger sm:col-span-2">{state.error}</p>}
      {state?.success && <p className="text-sm text-primary sm:col-span-2">Salvo.</p>}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Salvando..." : "Salvar alterações"}
      </Button>
    </form>
  );
}
