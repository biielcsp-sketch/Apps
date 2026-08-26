import type { getParticipantAttendanceHistory } from "@/lib/services/attendance.service";

const STATUS_LABELS: Record<string, string> = {
  presente: "Presente",
  ausente: "Ausente",
  justificou: "Justificou",
  nao_informado: "Não informado",
};

export function AttendanceHistory({
  history,
}: {
  history: Awaited<ReturnType<typeof getParticipantAttendanceHistory>>;
}) {
  if (history.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum registro de presença ainda.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {history.map((a) => (
        <li key={a.id} className="flex items-center justify-between text-sm">
          <span className="text-foreground">
            {a.meeting?.title} — {new Date(`${a.meeting?.date}T00:00:00`).toLocaleDateString("pt-BR")}
          </span>
          <span className="text-muted-foreground">{STATUS_LABELS[a.status]}</span>
        </li>
      ))}
    </ul>
  );
}
