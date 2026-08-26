"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { LeaderCreateSchema, LeaderUpdateSchema } from "@/lib/validators/leader.schema";
import { createLeaderAccount, updateLeader, setLeaderStatus } from "@/lib/services/leaders.service";
import { getCurrentProfile } from "@/lib/services/profiles.service";
import type { FormActionState } from "@/app/actions/participants";

function readOptionalString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() !== "" ? value : undefined;
}

export async function createLeaderAction(
  _state: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const profile = await getCurrentProfile();
  if (profile?.role !== "admin") return { error: "Apenas administradoras podem cadastrar líderes." };

  const validated = LeaderCreateSchema.safeParse({
    full_name: formData.get("full_name"),
    email: formData.get("email"),
    phone: readOptionalString(formData, "phone"),
    whatsapp: readOptionalString(formData, "whatsapp"),
    city: readOptionalString(formData, "city"),
    neighborhood: readOptionalString(formData, "neighborhood"),
    meeting_address: readOptionalString(formData, "meeting_address"),
    region: readOptionalString(formData, "region"),
    max_capacity: formData.get("max_capacity"),
  });

  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? "Verifique os campos do formulário." };
  }

  let leader;
  try {
    leader = await createLeaderAccount(validated.data);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao cadastrar líder." };
  }

  revalidatePath("/liderancas");
  redirect(`/liderancas/${leader.id}`);
}

export async function updateLeaderAction(
  id: string,
  _state: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const validated = LeaderUpdateSchema.safeParse({
    city: readOptionalString(formData, "city"),
    neighborhood: readOptionalString(formData, "neighborhood"),
    meeting_address: readOptionalString(formData, "meeting_address"),
    region: readOptionalString(formData, "region"),
    max_capacity: formData.get("max_capacity"),
    admin_notes: readOptionalString(formData, "admin_notes"),
  });

  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? "Verifique os campos do formulário." };
  }

  try {
    await updateLeader(id, validated.data);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao salvar." };
  }

  revalidatePath(`/liderancas/${id}`);
  return { success: true };
}

export async function toggleLeaderStatusAction(id: string, currentStatus: "ativa" | "inativa") {
  const profile = await getCurrentProfile();
  if (profile?.role !== "admin") throw new Error("Apenas administradoras podem inativar líderes.");

  await setLeaderStatus(id, currentStatus === "ativa" ? "inativa" : "ativa");
  revalidatePath("/liderancas");
  revalidatePath(`/liderancas/${id}`);
}
