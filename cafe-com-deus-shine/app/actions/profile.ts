"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile, updateMyProfile } from "@/lib/services/profiles.service";
import { MyProfileSchema } from "@/lib/validators/my-profile.schema";
import { toUserMessage } from "@/lib/errors";

export type FormActionState = { error?: string; success?: boolean } | undefined;

function readOptionalString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() !== "" ? value : undefined;
}

export async function updateMyProfileAction(
  _state: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Sessão expirada. Faça login novamente." };

  const validated = MyProfileSchema.safeParse({
    full_name: formData.get("full_name"),
    phone: readOptionalString(formData, "phone"),
    whatsapp: readOptionalString(formData, "whatsapp"),
  });
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    await updateMyProfile(validated.data);
  } catch (e) {
    return { error: toUserMessage(e, "actions.profile.updateMy", "Erro ao salvar seus dados.") };
  }

  revalidatePath("/", "layout");
  return { success: true };
}
