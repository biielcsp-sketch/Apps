import "server-only";
import { createClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/services/audit.service";
import type { MeetingInput } from "@/lib/validators/meeting.schema";
import type { Tables, TablesUpdate } from "@/types/database.types";

export type MeetingRow = Tables<"meetings">;

export async function listMeetings() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("meetings")
    .select("*, group:groups(id, name), leader:leaders(id, profile:profiles(full_name))")
    .order("date", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getMeeting(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("meetings")
    .select("*, group:groups(id, name), leader:leaders(id, profile:profiles(full_name))")
    .eq("id", id)
    .single();
  if (error) return null;
  return data;
}

export async function getMeetingParticipants(meetingId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("meeting_participants")
    .select("id, participant:participants(id, full_name)")
    .eq("meeting_id", meetingId);
  if (error) throw new Error(error.message);
  return data ?? [];
}

// Participantes do grupo que ainda não estão vinculadas ao encontro.
export async function getGroupParticipantsNotInMeeting(groupId: string, meetingId: string) {
  const supabase = await createClient();
  const { data: linked } = await supabase
    .from("meeting_participants")
    .select("participant_id")
    .eq("meeting_id", meetingId);
  const linkedIds = (linked ?? []).map((l) => l.participant_id);

  let query = supabase
    .from("participants")
    .select("id, full_name")
    .eq("current_group_id", groupId)
    .is("deleted_at", null);
  if (linkedIds.length > 0) {
    query = query.not("id", "in", `(${linkedIds.join(",")})`);
  }
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createMeeting(input: MeetingInput) {
  const supabase = await createClient();

  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("id, leader_id")
    .eq("id", input.group_id)
    .single();
  if (groupError || !group) throw new Error("Grupo não encontrado.");

  const { data: meeting, error } = await supabase
    .from("meetings")
    .insert({
      title: input.title,
      date: input.date,
      time: input.time || null,
      location: input.location || null,
      status: input.status ?? "planejado",
      group_id: group.id,
      leader_id: group.leader_id,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);

  // Vincula automaticamente todas as participantes atuais do grupo.
  const { data: groupParticipants } = await supabase
    .from("participants")
    .select("id")
    .eq("current_group_id", group.id)
    .is("deleted_at", null);

  if (groupParticipants && groupParticipants.length > 0) {
    await supabase.from("meeting_participants").insert(
      groupParticipants.map((p) => ({ meeting_id: meeting.id, participant_id: p.id })),
    );
  }

  await logAuditEvent({
    action: "meeting.create",
    entity: "meetings",
    entityId: meeting.id,
    after: { title: input.title, date: input.date, group_id: group.id },
  });

  return meeting;
}

export async function updateMeeting(id: string, input: TablesUpdate<"meetings">) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("meetings").update(input).eq("id", id).select().single();
  if (error) throw new Error(error.message);

  await logAuditEvent({ action: "meeting.update", entity: "meetings", entityId: id, after: input });
  return data;
}

export async function addMeetingParticipant(meetingId: string, participantId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("meeting_participants")
    .insert({ meeting_id: meetingId, participant_id: participantId });
  if (error) throw new Error(error.message);
}

export async function removeMeetingParticipant(meetingParticipantId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("meeting_participants").delete().eq("id", meetingParticipantId);
  if (error) throw new Error(error.message);
}
