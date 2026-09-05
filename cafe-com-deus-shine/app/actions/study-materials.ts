"use server";

import { revalidatePath } from "next/cache";
import {
  uploadStudyMaterial,
  deleteStudyMaterial,
  getStudyMaterialUrl,
} from "@/lib/services/study-materials.service";
import { toUserMessage } from "@/lib/errors";

export type StudyMaterialActionState = { error?: string; success?: boolean } | undefined;

export async function uploadStudyMaterialAction(
  _state: StudyMaterialActionState,
  formData: FormData,
): Promise<StudyMaterialActionState> {
  const file = formData.get("file");
  const title = String(formData.get("title") ?? "").trim();
  const referenceMonth = String(formData.get("reference_month") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!(file instanceof File)) return { error: "Selecione um arquivo." };
  if (!title) return { error: "Dê um título ao material." };
  if (!/^\d{4}-\d{2}$/.test(referenceMonth)) return { error: "Informe o mês de referência." };

  try {
    await uploadStudyMaterial({ file, title, description, referenceMonth });
    revalidatePath("/estudos");
    return { success: true };
  } catch (e) {
    return { error: toUserMessage(e, "actions.studyMaterials.upload", "Não foi possível enviar o material.") };
  }
}

export async function deleteStudyMaterialAction(id: string) {
  await deleteStudyMaterial(id);
  revalidatePath("/estudos");
}

// A URL assinada é gerada sob demanda (dura 10 minutos) — nunca fica
// embutida no HTML da listagem, que é cacheável.
export async function getStudyMaterialUrlAction(storagePath: string) {
  return getStudyMaterialUrl(storagePath);
}
