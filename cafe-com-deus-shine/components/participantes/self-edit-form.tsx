"use client";

import { useActionState } from "react";
import { updateMyParticipantProfileAction } from "@/app/actions/participants";
import { Button } from "@/components/ui/Button";
import {
  AVAILABILITY_DAYS,
  AVAILABILITY_DAY_LABELS,
  AVAILABILITY_PERIODS,
  AVAILABILITY_PERIOD_LABELS,
} from "@/lib/validators/participant.schema";
import type { FormActionState } from "@/app/actions/participants";
import type { ParticipantRow } from "@/lib/services/participants.service";

const inputClass =
  "w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary";
const labelClass = "text-sm font-medium text-foreground";

export function SelfEditForm({ participant }: { participant: ParticipantRow }) {
  const [state, action, pending] = useActionState<FormActionState, FormData>(
    updateMyParticipantProfileAction,
    undefined,
  );

  return (
    <form action={action} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-1.5">
        <label className={labelClass} htmlFor="phone">
          Telefone
        </label>
        <input id="phone" name="phone" defaultValue={participant.phone ?? ""} className={inputClass} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelClass} htmlFor="whatsapp">
          WhatsApp
        </label>
        <input id="whatsapp" name="whatsapp" defaultValue={participant.whatsapp ?? ""} className={inputClass} />
      </div>
      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <label className={labelClass} htmlFor="address">
          Endereço
        </label>
        <input id="address" name="address" defaultValue={participant.address ?? ""} className={inputClass} />
      </div>

      <div className="flex flex-col gap-2 sm:col-span-2">
        <span className={labelClass}>Dias disponíveis</span>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {AVAILABILITY_DAYS.map((day) => (
            <label key={day} className="flex items-center gap-1.5 text-sm text-foreground">
              <input
                type="checkbox"
                name="availability_days"
                value={day}
                defaultChecked={participant.availability_days?.includes(day)}
              />
              {AVAILABILITY_DAY_LABELS[day]}
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:col-span-2">
        <span className={labelClass}>Períodos disponíveis</span>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {AVAILABILITY_PERIODS.map((period) => (
            <label key={period} className="flex items-center gap-1.5 text-sm text-foreground">
              <input
                type="checkbox"
                name="availability_period"
                value={period}
                defaultChecked={participant.availability_period?.includes(period)}
              />
              {AVAILABILITY_PERIOD_LABELS[period]}
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={labelClass} htmlFor="location_preference">
          Preferência de localização
        </label>
        <input
          id="location_preference"
          name="location_preference"
          defaultValue={participant.location_preference ?? ""}
          className={inputClass}
        />
      </div>
      <div className="flex items-end pb-2.5">
        <label className="flex items-center gap-1.5 text-sm text-foreground">
          <input type="checkbox" name="home_meeting_ok" defaultChecked={participant.home_meeting_ok ?? true} />
          Disponível para encontros em casa
        </label>
      </div>

      {state?.error && <p className="text-sm text-danger sm:col-span-2">{state.error}</p>}
      <Button type="submit" disabled={pending} className="self-start sm:col-span-2">
        {pending ? "Salvando..." : "Salvar alterações"}
      </Button>
    </form>
  );
}
