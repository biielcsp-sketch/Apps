import { PARTICIPANT_STATUS_LABELS } from "@/lib/participant-status-labels";
import type { Enums } from "@/types/database.types";

const inputClass =
  "w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary";

export function ParticipantsFilters({
  variant,
  leaders,
  groups,
  defaults,
}: {
  variant: "admin" | "lider";
  leaders?: { id: string; full_name: string }[];
  groups?: { id: string; name: string }[];
  defaults: Record<string, string | undefined>;
}) {
  return (
    <form className="grid grid-cols-1 gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-2 md:grid-cols-4">
      <input
        name="search"
        placeholder="Buscar por nome"
        defaultValue={defaults.search}
        className={inputClass}
      />
      <select name="status" defaultValue={defaults.status ?? ""} className={inputClass}>
        <option value="">Todos os status</option>
        {(Object.entries(PARTICIPANT_STATUS_LABELS) as [Enums<"participant_status">, string][]).map(
          ([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ),
        )}
      </select>
      {variant === "admin" && (
        <>
          <select name="leaderId" defaultValue={defaults.leaderId ?? ""} className={inputClass}>
            <option value="">Todas as líderes</option>
            {leaders?.map((l) => (
              <option key={l.id} value={l.id}>
                {l.full_name}
              </option>
            ))}
          </select>
          <select name="groupId" defaultValue={defaults.groupId ?? ""} className={inputClass}>
            <option value="">Todos os grupos</option>
            {groups?.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
          <input
            name="region"
            placeholder="Cidade ou bairro"
            defaultValue={defaults.region}
            className={inputClass}
          />
        </>
      )}
      <input
        name="enrolledFrom"
        type="date"
        title="Inscrita a partir de"
        defaultValue={defaults.enrolledFrom}
        className={inputClass}
      />
      <input
        name="enrolledTo"
        type="date"
        title="Inscrita até"
        defaultValue={defaults.enrolledTo}
        className={inputClass}
      />
      <button
        type="submit"
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
      >
        Filtrar
      </button>
    </form>
  );
}
