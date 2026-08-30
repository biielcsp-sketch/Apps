"use server";

import { revalidatePath } from "next/cache";
import { uploadMyAvatar } from "@/lib/services/avatar.service";

export type AvatarActionState = { error?: string; success?: boolean } | undefined;

// Sem checagem de papel: qualquer usuária autenticada troca a PRÓPRIA
// foto — o service já resolve o uid da sessão, nunca aceita um id de
// outra pessoa.
export async function uploadAvatarAction(
  _state: AvatarActionState,
  formData: FormData,
): Promise<AvatarActionState> {
  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Selecione uma imagem." };
  }

  try {
    await uploadMyAvatar(file);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao enviar a imagem." };
  }

  revalidatePath("/", "layout");
  return { success: true };
}
