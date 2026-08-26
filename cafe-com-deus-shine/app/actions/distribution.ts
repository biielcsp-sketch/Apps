"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { confirmDistribution } from "@/lib/services/distribution.service";
import { transferParticipant } from "@/lib/services/transfer.service";
import { getCurrentProfile } from "@/lib/services/profiles.service";

export async function confirmDistributionAction(participantId: string, formData: FormData) {
  const profile = await getCurrentProfile();
  if (profile?.role !== "admin") throw new Error("Apenas administradoras podem distribuir participantes.");

  const leaderId = formData.get("leader_id") as string | null;
  const groupId = (formData.get("group_id") as string | null) || null;
  if (!leaderId) throw new Error("Selecione uma líder.");

  await confirmDistribution(participantId, leaderId, groupId);
  revalidatePath("/participantes/aguardando-distribuicao");
  revalidatePath(`/participantes/${participantId}`);
  redirect(`/participantes/${participantId}`);
}

export async function transferParticipantAction(participantId: string, formData: FormData) {
  const profile = await getCurrentProfile();
  if (profile?.role !== "admin") throw new Error("Apenas administradoras podem transferir participantes.");

  const leaderId = formData.get("leader_id") as string | null;
  const groupId = (formData.get("group_id") as string | null) || null;
  const reason = (formData.get("reason") as string | null) || null;
  if (!leaderId) throw new Error("Selecione a nova líder.");

  await transferParticipant(participantId, leaderId, groupId, reason);
  revalidatePath(`/participantes/${participantId}`);
}
