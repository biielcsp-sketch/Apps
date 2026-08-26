"use server";

import { revalidatePath } from "next/cache";
import { FollowUpSchema } from "@/lib/validators/followup.schema";
import { createFollowUp } from "@/lib/services/followup.service";
import { createClient } from "@/lib/supabase/server";
import type { FormActionState } from "@/app/actions/participants";

export async function createFollowUpAction(
  participantId: string,
  basePath: string,
  _state: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const validated = FollowUpSchema.safeParse({
    date: formData.get("date"),
    type: formData.get("type"),
    status: formData.get("status") || undefined,
    observation: formData.get("observation"),
    needs_return: formData.get("needs_return") === "on",
    next_follow_up_date: formData.get("next_follow_up_date"),
  });

  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? "Verifique os campos do formulário." };
  }

  const supabase = await createClient();
  const { data: leader } = await supabase
    .from("leaders")
    .select("id")
    .eq("profile_id", (await supabase.auth.getUser()).data.user?.id ?? "")
    .maybeSingle();

  // Admin sem registro em `leaders` não tem um leader_id próprio; nesse
  // caso usa a líder atual da participante (follow_ups exige leader_id).
  let leaderId = leader?.id;
  if (!leaderId) {
    const { data: participant } = await supabase
      .from("participants")
      .select("current_leader_id")
      .eq("id", participantId)
      .single();
    leaderId = participant?.current_leader_id ?? undefined;
  }
  if (!leaderId) return { error: "Participante sem líder atribuída — não é possível registrar acompanhamento." };

  try {
    await createFollowUp(participantId, leaderId, validated.data);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao registrar acompanhamento." };
  }

  revalidatePath(`${basePath}/${participantId}`);
  return { success: true };
}
