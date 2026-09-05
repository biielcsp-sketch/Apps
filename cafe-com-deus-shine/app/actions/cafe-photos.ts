"use server";

import { revalidatePath } from "next/cache";
import { uploadCafePhoto, deleteCafePhoto } from "@/lib/services/cafe-photos.service";
import { toUserMessage } from "@/lib/errors";

export type CafePhotoActionState = { error?: string; success?: boolean } | undefined;

export async function uploadCafePhotoAction(
  _state: CafePhotoActionState,
  formData: FormData,
): Promise<CafePhotoActionState> {
  const file = formData.get("file");
  const groupId = String(formData.get("group_id") ?? "");
  const caption = String(formData.get("caption") ?? "");

  if (!(file instanceof File)) return { error: "Selecione uma foto." };
  if (!groupId) return { error: "Selecione o café." };

  try {
    await uploadCafePhoto({ file, groupId, caption });
    revalidatePath("/feed");
    return { success: true };
  } catch (e) {
    return { error: toUserMessage(e, "actions.cafePhotos.upload", "Não foi possível enviar a foto.") };
  }
}

export async function deleteCafePhotoAction(id: string) {
  await deleteCafePhoto(id);
  revalidatePath("/feed");
}
