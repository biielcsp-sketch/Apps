"use server";

import { revalidatePath } from "next/cache";
import { upsertAttendance } from "@/lib/services/attendance.service";
import { getCurrentProfile } from "@/lib/services/profiles.service";
import { getCurrentParticipant } from "@/lib/services/participants.service";
import type { Enums } from "@/types/database.types";

export async function markAttendanceAction(
  meetingId: string,
  participantId: string,
  basePath: string,
  formData: FormData,
) {
  const status = formData.get("status") as Enums<"attendance_status"> | null;
  const notes = (formData.get("notes") as string | null) || null;
  if (!status) throw new Error("Selecione um status de presença.");

  await upsertAttendance(meetingId, participantId, status, notes);
  revalidatePath(`${basePath}/${meetingId}/presenca`);
}

// A própria participante confirmando presença num encontro do seu grupo —
// só pode marcar 'presente' (garantido também pela RLS/policy no banco).
export async function confirmMyAttendanceAction(meetingId: string) {
  const profile = await getCurrentProfile();
  if (profile?.role !== "participante") {
    throw new Error("Apenas a própria participante pode confirmar presença.");
  }

  const participant = await getCurrentParticipant();
  if (!participant) throw new Error("Cadastro de participante não encontrado.");

  await upsertAttendance(meetingId, participant.id, "presente", null);
  revalidatePath("/minha-jornada");
}
