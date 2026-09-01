"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/services/profiles.service";
import { logContactStatus } from "@/lib/services/contact-status.service";
import { toUserMessage } from "@/lib/errors";
import type { Enums } from "@/types/database.types";

export type ContactStatusActionResult = { error?: string } | undefined;

export async function logContactStatusAction(
  participantId: string,
  status: Enums<"contact_status">,
  note: string,
  basePath: string,
): Promise<ContactStatusActionResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Sessão expirada. Faça login novamente." };

  try {
    await logContactStatus(participantId, status, note.trim() || null, profile.id);
  } catch (e) {
    return { error: toUserMessage(e, "actions.contactStatus.log", "Erro ao salvar o acompanhamento.") };
  }

  revalidatePath(`${basePath}/${participantId}`);
  return undefined;
}
