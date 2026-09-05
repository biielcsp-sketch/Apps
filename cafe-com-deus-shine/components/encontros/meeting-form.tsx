"use client";

import { useActionState } from "react";
import { createMeetingAction, updateMeetingAction } from "@/app/actions/meetings";
import { Button } from "@/components/ui/Button";
import type { FormActionState } from "@/app/actions/participants";
import type { MeetingRow } from "@/lib/services/meetings.service";

const inputClass =
  "w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary";
const labelClass = "text-sm font-medium text-foreground";

export function MeetingForm({
  meeting,
  groups,
  basePath,
}: {
  meeting?: MeetingRow;
  groups: { id: string; name: string }[];
  basePath: string;
}) {
  const action = meeting
    ? updateMeetingAction.bind(null, meeting.id, basePath)
    : createMeetingAction.bind(null, basePath);
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(action, undefined);

  return (
    <form action={formAction} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <label className={labelClass} htmlFor="title">Título</label>
        <input id="title" name="title" required defaultValue={meeting?.title ?? ""} className={inputClass} />
      </div>
      {!meeting && (
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label className={labelClass} htmlFor="group_id">Grupo</label>
          <select id="group_id" name="group_id" required className={inputClass}>
            <option value="">Selecione...</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        <label className={labelClass} htmlFor="date">Data</label>
        <input id="date" name="date" type="date" required defaultValue={meeting?.date ?? ""} className={inputClass} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelClass} htmlFor="time">Horário</label>
        <input id="time" name="time" type="time" defaultValue={meeting?.time ?? ""} className={inputClass} />
      </div>
      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <label className={labelClass} htmlFor="location">Local</label>
        <input id="location" name="location" defaultValue={meeting?.location ?? ""} className={inputClass} />
      </div>
      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <label className={labelClass} htmlFor="ministered_by">Quem ministrou a palavra</label>
        <input
          id="ministered_by"
          name="ministered_by"
          defaultValue={meeting?.ministered_by ?? ""}
          placeholder="Nome de quem ministrou no encontro"
          className={inputClass}
        />
      </div>
      {meeting && (
        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor="status">Status</label>
          <select id="status" name="status" defaultValue={meeting.status} className={inputClass}>
            <option value="planejado">Planejado</option>
            <option value="confirmado">Confirmado</option>
            <option value="realizado">Realizado</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>
      )}
      {state?.error && <p className="text-sm text-danger sm:col-span-2">{state.error}</p>}
      {state?.success && <p className="text-sm text-primary sm:col-span-2">Salvo.</p>}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Salvando..." : meeting ? "Salvar alterações" : "Criar encontro"}
      </Button>
    </form>
  );
}
