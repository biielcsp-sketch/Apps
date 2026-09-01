import { markAttendanceAction } from "@/app/actions/attendance";

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "nao_informado", label: "Não informado" },
  { value: "presente", label: "Presente" },
  { value: "ausente", label: "Ausente" },
  { value: "justificou", label: "Justificou" },
];

const STATUS_BADGE: Record<string, string> = {
  presente: "bg-primary/15 text-primary",
  ausente: "bg-danger/15 text-danger",
  justificou: "bg-accent/30 text-foreground",
  nao_informado: "bg-muted text-muted-foreground",
};

export function AttendanceRoll({
  meetingId,
  basePath,
  rows,
}: {
  meetingId: string;
  basePath: string;
  rows: { meetingParticipantId: string; participantId: string; fullName: string; status: string; notes: string }[];
}) {
  if (rows.length === 0) {
    return (
      <p className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
        Nenhuma participante vinculada a este encontro.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {rows.map((row) => (
        <form
          key={row.meetingParticipantId}
          action={markAttendanceAction.bind(null, meetingId, row.participantId, basePath)}
          className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate text-sm font-medium text-foreground">{row.fullName}</span>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[row.status]}`}>
              {STATUS_OPTIONS.find((o) => o.value === row.status)?.label}
            </span>
          </div>
          <div className="flex gap-2">
            <select
              name="status"
              defaultValue={row.status}
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <input
              name="notes"
              placeholder="Nota (opcional)"
              defaultValue={row.notes}
              className="w-40 rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="submit"
              className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
            >
              Salvar
            </button>
          </div>
        </form>
      ))}
    </div>
  );
}
