import Link from "next/link";
import { Pencil } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { getCurrentProfile } from "@/lib/services/profiles.service";
import { getCurrentParticipant, getParticipantTimeline } from "@/lib/services/participants.service";
import { getParticipantAttendanceHistory } from "@/lib/services/attendance.service";
import { listGroupMeetings } from "@/lib/services/meetings.service";
import { Timeline } from "@/components/participantes/timeline";
import { AttendanceHistory } from "@/components/participantes/attendance-history";
import { confirmMyAttendanceAction } from "@/app/actions/attendance";

export default async function MinhaJornadaPage() {
  const profile = await getCurrentProfile();
  const participant = await getCurrentParticipant();

  if (!participant) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Olá, {profile?.full_name.split(" ")[0]} 🌷
        </h1>
        <Card className="mt-6 p-6">
          <p className="text-sm text-muted-foreground">
            Sua conta ainda não está vinculada a um cadastro de participante. Fale com a administradora.
          </p>
        </Card>
      </div>
    );
  }

  const [timeline, attendanceHistory, groupMeetings] = await Promise.all([
    getParticipantTimeline(participant.id),
    getParticipantAttendanceHistory(participant.id),
    participant.group ? listGroupMeetings(participant.group.id) : Promise.resolve([]),
  ]);

  const confirmedMeetingIds = new Set(
    attendanceHistory.filter((a) => a.status === "presente").map((a) => a.meeting?.id),
  );
  const today = new Date().toISOString().slice(0, 10);
  const upcomingMeetings = groupMeetings.filter((m) => m.date >= today && m.status !== "cancelado");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Olá, {profile?.full_name.split(" ")[0]} 🌷
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Líder: {participant.leader?.profile?.full_name ?? "sem líder"} · Grupo:{" "}
          {participant.group?.name ?? "sem grupo"}
        </p>
      </div>

      {participant.leader && (
        <Card className="p-5">
          <p className="mb-2 text-sm font-semibold text-foreground">Minha líder</p>
          <p className="text-sm text-foreground">{participant.leader.profile?.full_name}</p>
          <p className="text-sm text-muted-foreground">
            {participant.leader.profile?.phone ?? participant.leader.profile?.whatsapp ?? "sem contato informado"}
          </p>
        </Card>
      )}

      <Card className="p-5">
        <p className="mb-3 text-sm font-semibold text-foreground">Próximos encontros</p>
        {upcomingMeetings.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum encontro agendado.</p>
        )}
        <div className="flex flex-col gap-3">
          {upcomingMeetings.map((meeting) => (
            <div
              key={meeting.id}
              className="flex flex-col gap-2 rounded-xl border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{meeting.title}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(`${meeting.date}T00:00:00`).toLocaleDateString("pt-BR")}
                  {meeting.time ? ` — ${meeting.time.slice(0, 5)}` : ""}
                  {meeting.location ? ` — ${meeting.location}` : ""}
                </p>
              </div>
              {confirmedMeetingIds.has(meeting.id) ? (
                <span className="self-start rounded-full bg-primary/15 px-3 py-1.5 text-xs font-medium text-primary sm:self-auto">
                  Presença confirmada
                </span>
              ) : (
                <form action={confirmMyAttendanceAction.bind(null, meeting.id)}>
                  <button
                    type="submit"
                    className="rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground"
                  >
                    Confirmar presença
                  </button>
                </form>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">Meus dados</p>
          <Link
            href="/minha-jornada/editar"
            className="flex items-center gap-1.5 text-sm font-medium text-primary"
          >
            <Pencil size={15} />
            Editar
          </Link>
        </div>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          <Info label="Telefone" value={participant.phone} />
          <Info label="WhatsApp" value={participant.whatsapp} />
          <Info label="Endereço" value={participant.address} />
          <Info
            label="Disponível para encontros em casa"
            value={participant.home_meeting_ok ? "Sim" : "Não"}
          />
        </dl>
      </Card>

      <Card className="p-6">
        <p className="text-sm font-semibold text-foreground">Minha jornada</p>
        <div className="mt-3">
          <Timeline entries={timeline} />
        </div>
      </Card>

      <Card className="p-6">
        <p className="mb-3 text-sm font-semibold text-foreground">Presença</p>
        <AttendanceHistory history={attendanceHistory} />
      </Card>
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-foreground">{value || "—"}</dd>
    </div>
  );
}
