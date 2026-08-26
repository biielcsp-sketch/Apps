import {
  AVAILABILITY_DAYS,
  AVAILABILITY_DAY_LABELS,
  AVAILABILITY_PERIODS,
  AVAILABILITY_PERIOD_LABELS,
} from "@/lib/validators/participant.schema";
import type { ParticipantRow } from "@/lib/services/participants.service";

const inputClass =
  "w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary";
const labelClass = "text-sm font-medium text-foreground";

export function PersonalFields({ defaults }: { defaults?: Partial<ParticipantRow> }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <label className={labelClass} htmlFor="full_name">
          Nome completo
        </label>
        <input
          id="full_name"
          name="full_name"
          required
          defaultValue={defaults?.full_name ?? ""}
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelClass} htmlFor="preferred_name">
          Como prefere ser chamada
        </label>
        <input
          id="preferred_name"
          name="preferred_name"
          defaultValue={defaults?.preferred_name ?? ""}
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelClass} htmlFor="birth_date">
          Data de nascimento
        </label>
        <input
          id="birth_date"
          name="birth_date"
          type="date"
          defaultValue={defaults?.birth_date ?? ""}
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelClass} htmlFor="phone">
          Telefone
        </label>
        <input id="phone" name="phone" defaultValue={defaults?.phone ?? ""} className={inputClass} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelClass} htmlFor="whatsapp">
          WhatsApp
        </label>
        <input
          id="whatsapp"
          name="whatsapp"
          defaultValue={defaults?.whatsapp ?? ""}
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <label className={labelClass} htmlFor="email">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          defaultValue={defaults?.email ?? ""}
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelClass} htmlFor="city">
          Cidade
        </label>
        <input id="city" name="city" defaultValue={defaults?.city ?? ""} className={inputClass} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelClass} htmlFor="neighborhood">
          Bairro
        </label>
        <input
          id="neighborhood"
          name="neighborhood"
          defaultValue={defaults?.neighborhood ?? ""}
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <label className={labelClass} htmlFor="address">
          Endereço
        </label>
        <input
          id="address"
          name="address"
          defaultValue={defaults?.address ?? ""}
          className={inputClass}
        />
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
                defaultChecked={defaults?.availability_days?.includes(day)}
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
                defaultChecked={defaults?.availability_period?.includes(period)}
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
          defaultValue={defaults?.location_preference ?? ""}
          className={inputClass}
        />
      </div>
      <div className="flex items-end pb-2.5">
        <label className="flex items-center gap-1.5 text-sm text-foreground">
          <input
            type="checkbox"
            name="home_meeting_ok"
            defaultChecked={defaults?.home_meeting_ok ?? true}
          />
          Disponível para encontros em casa
        </label>
      </div>

      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <label className={labelClass} htmlFor="other_notes">
          Outras informações relevantes
        </label>
        <textarea
          id="other_notes"
          name="other_notes"
          rows={3}
          defaultValue={defaults?.other_notes ?? ""}
          className={inputClass}
        />
      </div>
    </div>
  );
}

export { inputClass, labelClass };
