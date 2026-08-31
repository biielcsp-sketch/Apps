"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { MeetingSchema } from "@/lib/validators/meeting.schema";
import {
  createMeeting,
  updateMeeting,
  addMeetingParticipant,
  removeMeetingParticipant,
} from "@/lib/services/meetings.service";
import { AppError, toUserMessage } from "@/lib/errors";
import type { FormActionState } from "@/app/actions/participants";

function readOptionalString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() !== "" ? value : undefined;
}

function parseMeetingForm(formData: FormData) {
  return MeetingSchema.safeParse({
    title: formData.get("title"),
    group_id: formData.get("group_id"),
    date: formData.get("date"),
    time: readOptionalString(formData, "time"),
    location: readOptionalString(formData, "location"),
    status: formData.get("status") || undefined,
  });
}

export async function createMeetingAction(
  basePath: string,
  _state: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const validated = parseMeetingForm(formData);
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? "Verifique os campos do formulário." };
  }

  let meeting;
  try {
    meeting = await createMeeting(validated.data);
  } catch (e) {
    return { error: toUserMessage(e, "actions.meetings.create", "Erro ao criar encontro.") };
  }

  revalidatePath(basePath);
  redirect(`${basePath}/${meeting.id}`);
}

export async function updateMeetingAction(
  id: string,
  basePath: string,
  _state: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const validated = parseMeetingForm(formData);
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? "Verifique os campos do formulário." };
  }

  try {
    await updateMeeting(id, {
      title: validated.data.title,
      date: validated.data.date,
      time: validated.data.time || null,
      location: validated.data.location || null,
      status: validated.data.status,
    });
  } catch (e) {
    return { error: toUserMessage(e, "actions.meetings.update", "Erro ao salvar encontro.") };
  }

  revalidatePath(`${basePath}/${id}`);
  return { success: true };
}

export async function addMeetingParticipantAction(meetingId: string, basePath: string, formData: FormData) {
  const participantId = formData.get("participant_id") as string | null;
  if (!participantId) throw new AppError("Selecione uma participante.");
  await addMeetingParticipant(meetingId, participantId);
  revalidatePath(`${basePath}/${meetingId}`);
}

export async function removeMeetingParticipantAction(
  meetingParticipantId: string,
  meetingId: string,
  basePath: string,
) {
  await removeMeetingParticipant(meetingParticipantId);
  revalidatePath(`${basePath}/${meetingId}`);
}
