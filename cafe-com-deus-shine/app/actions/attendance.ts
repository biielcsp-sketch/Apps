"use server";

import { revalidatePath } from "next/cache";
import { upsertAttendance } from "@/lib/services/attendance.service";
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
