"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { confirmDistribution } from "@/lib/services/distribution.service";
import { transferParticipant } from "@/lib/services/transfer.service";
import { getCurrentProfile, isAdminRole } from "@/lib/services/profiles.service";
import { logAuthEvent, isRlsDenied } from "@/lib/services/auth-audit.service";

export async function confirmDistributionAction(participantId: string, formData: FormData) {
  const profile = await getCurrentProfile();
  if (!isAdminRole(profile?.role)) throw new Error("Apenas administradoras podem distribuir participantes.");

  const leaderId = formData.get("leader_id") as string | null;
  const groupId = (formData.get("group_id") as string | null) || null;
  if (!leaderId) throw new Error("Selecione uma líder.");

  try {
    await confirmDistribution(participantId, leaderId, groupId);
  } catch (e) {
    // Só dispara com bypass do isAdminRole acima — INSERT em
    // participant_leader_history só tem policy de admin.
    if (isRlsDenied(e)) {
      await logAuthEvent("access_denied", profile!.id, { action: "confirmDistribution" });
    }
    throw e;
  }
  revalidatePath("/participantes/aguardando-distribuicao");
  revalidatePath(`/participantes/${participantId}`);
  redirect(`/participantes/${participantId}`);
}

export async function transferParticipantAction(participantId: string, formData: FormData) {
  const profile = await getCurrentProfile();
  if (!isAdminRole(profile?.role)) throw new Error("Apenas administradoras podem transferir participantes.");

  const leaderId = formData.get("leader_id") as string | null;
  const groupId = (formData.get("group_id") as string | null) || null;
  const reason = (formData.get("reason") as string | null) || null;
  if (!leaderId) throw new Error("Selecione a nova líder.");

  try {
    await transferParticipant(participantId, leaderId, groupId, reason);
  } catch (e) {
    if (isRlsDenied(e)) {
      await logAuthEvent("access_denied", profile!.id, { action: "transferParticipant" });
    }
    throw e;
  }
  revalidatePath(`/participantes/${participantId}`);
}
