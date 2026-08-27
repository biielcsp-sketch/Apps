import Link from "next/link";
import { ClipboardCheck } from "lucide-react";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { getMeeting, getMeetingParticipants, getGroupParticipantsNotInMeeting } from "@/lib/services/meetings.service";
import { listGroups } from "@/lib/services/groups.service";
import { MeetingForm } from "@/components/encontros/meeting-form";
import { MeetingParticipantsPanel } from "@/components/encontros/meeting-participants-panel";
import { PageHeader } from "@/components/ui/PageHeader";

export default async function EncontroPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const meeting = await getMeeting(id);
  if (!meeting) notFound();

  const [groups, linked, available] = await Promise.all([
    listGroups(),
    getMeetingParticipants(id),
    getGroupParticipantsNotInMeeting(meeting.group_id, id),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={meeting.title}>
        <Link
          href={`/encontros/${id}/presenca`}
          className="flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
        >
          <ClipboardCheck size={16} />
          Chamada
        </Link>
      </PageHeader>

      <Card className="p-6">
        <MeetingForm meeting={meeting} groups={groups} basePath="/encontros" />
      </Card>

      <Card className="p-6">
        <p className="mb-3 text-sm font-semibold text-foreground">Participantes vinculadas</p>
        <MeetingParticipantsPanel meetingId={id} basePath="/encontros" linked={linked} available={available} />
      </Card>
    </div>
  );
}
