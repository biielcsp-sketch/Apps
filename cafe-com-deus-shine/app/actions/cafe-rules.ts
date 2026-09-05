"use server";

import { revalidatePath } from "next/cache";
import { updateCafeRules } from "@/lib/services/cafe-rules.service";
import { toUserMessage } from "@/lib/errors";

export type CafeRulesActionState = { error?: string; success?: boolean } | undefined;

export async function updateCafeRulesAction(
  _state: CafeRulesActionState,
  formData: FormData,
): Promise<CafeRulesActionState> {
  const text = String(formData.get("text") ?? "");

  try {
    await updateCafeRules(text);
    revalidatePath("/configuracoes/regras");
    revalidatePath("/cadastro");
    revalidatePath("/minha-jornada");
    return { success: true };
  } catch (e) {
    return { error: toUserMessage(e, "actions.cafeRules.update", "Não foi possível salvar as regras.") };
  }
}
