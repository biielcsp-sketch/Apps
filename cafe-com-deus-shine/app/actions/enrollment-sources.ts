"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import {
  createEnrollmentSource,
  setEnrollmentSourceActive,
} from "@/lib/services/enrollment-sources.service";
import { toUserMessage } from "@/lib/errors";

export type FormActionState = { error?: string; success?: boolean } | undefined;

const CreateSourceSchema = z.object({
  label: z.string().trim().min(2, { error: "Informe um nome para identificar esta origem." }),
  code: z.string().trim().optional(),
});

export async function createEnrollmentSourceAction(
  _state: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const validated = CreateSourceSchema.safeParse({
    label: formData.get("label"),
    code: (formData.get("code") as string | null) || undefined,
  });
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? "Verifique os campos do formulário." };
  }

  try {
    await createEnrollmentSource(validated.data.label, validated.data.code);
  } catch (e) {
    return { error: toUserMessage(e, "actions.enrollmentSources.create", "Erro ao criar código de inscrição.") };
  }

  revalidatePath("/configuracoes/qrcodes");
  return { success: true };
}

export async function toggleEnrollmentSourceActiveAction(id: string, currentActive: boolean) {
  await setEnrollmentSourceActive(id, !currentActive);
  revalidatePath("/configuracoes/qrcodes");
  revalidatePath(`/configuracoes/qrcodes/${id}`);
}
