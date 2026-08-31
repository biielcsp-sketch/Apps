import { notFound } from "next/navigation";
import { getMeeting } from "@/lib/services/meetings.service";
import { getAttendanceForMeeting } from "@/lib/services/attendance.service";
import { AttendanceRoll } from "@/components/presenca/attendance-roll";
import { BackLink } from "@/components/ui/BackLink";

export default async function ChamadaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const meeting = await getMeeting(id);
  if (!meeting) notFound();

  const rows = await getAttendanceForMeeting(id);

  return (
    <div>
      <BackLink href={`/meus-encontros/${id}`} label={meeting.title} />
      <h1 className="mt-3 text-2xl font-semibold text-foreground">Chamada — {meeting.title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {new Date(`${meeting.date}T00:00:00`).toLocaleDateString("pt-BR")}
      </p>
      <div className="mt-4">
        <AttendanceRoll meetingId={id} basePath="/meus-encontros" rows={rows} />
      </div>
    </div>
  );
}
