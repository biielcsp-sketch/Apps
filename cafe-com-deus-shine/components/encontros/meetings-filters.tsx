import type { Enums } from "@/types/database.types";

const inputClass =
  "w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary";

const STATUS_LABELS: Record<Enums<"meeting_status">, string> = {
  planejado: "Planejado",
  confirmado: "Confirmado",
  realizado: "Realizado",
  cancelado: "Cancelado",
};

export function MeetingsFilters({
  leaders,
  groups,
  defaults,
}: {
  leaders: { id: string; full_name: string }[];
  groups: { id: string; name: string }[];
  defaults: Record<string, string | undefined>;
}) {
  return (
    <form className="grid grid-cols-1 gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-2 md:grid-cols-4">
      <input
        name="search"
        placeholder="Buscar por título"
        defaultValue={defaults.search}
        className={inputClass}
      />
      <select name="status" defaultValue={defaults.status ?? ""} className={inputClass}>
        <option value="">Todos os status</option>
        {(Object.entries(STATUS_LABELS) as [Enums<"meeting_status">, string][]).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <select name="leaderId" defaultValue={defaults.leaderId ?? ""} className={inputClass}>
        <option value="">Todas as líderes</option>
        {leaders.map((l) => (
          <option key={l.id} value={l.id}>
            {l.full_name}
          </option>
        ))}
      </select>
      <select name="groupId" defaultValue={defaults.groupId ?? ""} className={inputClass}>
        <option value="">Todos os grupos</option>
        {groups.map((g) => (
          <option key={g.id} value={g.id}>
            {g.name}
          </option>
        ))}
      </select>
      <input
        name="location"
        placeholder="Local"
        defaultValue={defaults.location}
        className={inputClass}
      />
      <input
        name="dateFrom"
        type="date"
        title="Encontros a partir de"
        defaultValue={defaults.dateFrom}
        className={inputClass}
      />
      <input
        name="dateTo"
        type="date"
        title="Encontros até"
        defaultValue={defaults.dateTo}
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
