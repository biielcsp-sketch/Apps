"use client";

import { useActionState } from "react";
import { createGroupAction, updateGroupAction } from "@/app/actions/groups";
import { AVAILABILITY_DAYS, AVAILABILITY_DAY_LABELS } from "@/lib/validators/participant.schema";
import { Button } from "@/components/ui/Button";
import type { FormActionState } from "@/app/actions/participants";
import type { GroupRow } from "@/lib/services/groups.service";

const inputClass =
  "w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary";
const labelClass = "text-sm font-medium text-foreground";

export function GroupForm({
  group,
  leaders,
  hosts = [],
}: {
  group?: GroupRow;
  leaders: { id: string; full_name: string }[];
  // Contas com papel Anfitriã — ela enxerga o café que hospeda como a
  // líder enxerga, mas sem poder alterar nada.
  hosts?: { id: string; full_name: string }[];
}) {
  const action = group ? updateGroupAction.bind(null, group.id) : createGroupAction;
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(action, undefined);

  return (
    <form action={formAction} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <label className={labelClass} htmlFor="name">Nome do grupo</label>
        <input id="name" name="name" required defaultValue={group?.name ?? ""} className={inputClass} />
      </div>
      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <label className={labelClass} htmlFor="host_profile_id">Anfitriã (opcional)</label>
        <select
          id="host_profile_id"
          name="host_profile_id"
          defaultValue={group?.host_profile_id ?? ""}
          className={inputClass}
        >
          <option value="">Sem anfitriã</option>
          {hosts.map((h) => (
            <option key={h.id} value={h.id}>{h.full_name}</option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <label className={labelClass} htmlFor="leader_id">Líder responsável</label>
        <select id="leader_id" name="leader_id" required defaultValue={group?.leader_id ?? ""} className={inputClass}>
          <option value="">Selecione...</option>
          {leaders.map((l) => (
            <option key={l.id} value={l.id}>{l.full_name}</option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <label className={labelClass} htmlFor="address">Endereço</label>
        <input id="address" name="address" defaultValue={group?.address ?? ""} className={inputClass} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelClass} htmlFor="region">Região</label>
        <input id="region" name="region" defaultValue={group?.region ?? ""} className={inputClass} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelClass} htmlFor="capacity">Capacidade</label>
        <input
          id="capacity"
          name="capacity"
          type="number"
          min={1}
          required
          defaultValue={group?.capacity ?? 12}
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelClass} htmlFor="meeting_time">Horário</label>
        <input
          id="meeting_time"
          name="meeting_time"
          type="time"
          defaultValue={group?.meeting_time ?? ""}
          className={inputClass}
        />
      </div>
      {group && (
        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor="status">Status</label>
          <select id="status" name="status" defaultValue={group.status} className={inputClass}>
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
            <option value="lotado">Lotado</option>
          </select>
        </div>
      )}
      <div className="flex flex-col gap-2 sm:col-span-2">
        <span className={labelClass}>Dias disponíveis</span>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {AVAILABILITY_DAYS.map((day) => (
            <label key={day} className="flex items-center gap-1.5 text-sm text-foreground">
              <input
                type="checkbox"
                name="available_days"
                value={day}
                defaultChecked={group?.available_days?.includes(day)}
              />
              {AVAILABILITY_DAY_LABELS[day]}
            </label>
          ))}
        </div>
      </div>

      {state?.error && <p className="text-sm text-danger sm:col-span-2">{state.error}</p>}
      {state?.success && <p className="text-sm text-primary sm:col-span-2">Salvo.</p>}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Salvando..." : group ? "Salvar alterações" : "Criar grupo"}
      </Button>
    </form>
  );
}
