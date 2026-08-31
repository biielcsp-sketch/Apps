import "server-only";
import { createClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/services/audit.service";
import { dbError } from "@/lib/errors";
import type { Enums } from "@/types/database.types";

export async function getAttendanceForMeeting(meetingId: string) {
  const supabase = await createClient();

  const { data: participants, error: participantsError } = await supabase
    .from("meeting_participants")
    .select("id, participant:participants(id, full_name)")
    .eq("meeting_id", meetingId);
  if (participantsError) dbError(participantsError, "attendance.forMeeting.participants");

  const { data: attendance, error: attendanceError } = await supabase
    .from("attendance")
    .select("participant_id, status, notes")
    .eq("meeting_id", meetingId);
  if (attendanceError) dbError(attendanceError, "attendance.forMeeting");

  const byParticipant = new Map(attendance?.map((a) => [a.participant_id, a]));

  return (participants ?? []).map((mp) => ({
    meetingParticipantId: mp.id,
    participantId: mp.participant?.id ?? "",
    fullName: mp.participant?.full_name ?? "",
    status: (byParticipant.get(mp.participant?.id ?? "")?.status ?? "nao_informado") as Enums<"attendance_status">,
    notes: byParticipant.get(mp.participant?.id ?? "")?.notes ?? "",
  }));
}

export async function upsertAttendance(
  meetingId: string,
  participantId: string,
  status: Enums<"attendance_status">,
  notes: string | null,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("attendance")
    .upsert(
      {
        meeting_id: meetingId,
        participant_id: participantId,
        status,
        notes,
        registered_by: user?.id ?? null,
        registered_at: new Date().toISOString(),
      },
      { onConflict: "meeting_id,participant_id" },
    );
  if (error) dbError(error, "attendance.upsert");

  await logAuditEvent({
    action: "attendance.update",
    entity: "attendance",
    entityId: meetingId,
    after: { participant_id: participantId, status },
  });
}

export async function getParticipantAttendanceHistory(participantId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("attendance")
    .select("id, status, meeting:meetings(id, title, date)")
    .eq("participant_id", participantId)
    .order("id", { ascending: false });

  if (error) dbError(error, "attendance.participantHistory");
  return (data ?? []).filter((a) => a.meeting).sort((a, b) => (b.meeting!.date).localeCompare(a.meeting!.date));
}
