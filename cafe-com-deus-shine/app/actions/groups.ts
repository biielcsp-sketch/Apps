"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { GroupSchema } from "@/lib/validators/leader.schema";
import { createGroup, updateGroup } from "@/lib/services/groups.service";
import type { FormActionState } from "@/app/actions/participants";

function readOptionalString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() !== "" ? value : undefined;
}

function readArray(formData: FormData, key: string) {
  const values = formData.getAll(key).map(String).filter(Boolean);
  return values.length > 0 ? values : undefined;
}

function parseGroupForm(formData: FormData) {
  return GroupSchema.safeParse({
    name: formData.get("name"),
    leader_id: formData.get("leader_id"),
    address: readOptionalString(formData, "address"),
    capacity: formData.get("capacity"),
    region: readOptionalString(formData, "region"),
    available_days: readArray(formData, "available_days"),
    meeting_time: readOptionalString(formData, "meeting_time"),
    status: formData.get("status") || undefined,
  });
}

export async function createGroupAction(
  _state: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const validated = parseGroupForm(formData);
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? "Verifique os campos do formulário." };
  }

  let group;
  try {
    group = await createGroup(validated.data);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao criar grupo." };
  }

  revalidatePath("/grupos");
  redirect(`/grupos/${group.id}`);
}

export async function updateGroupAction(
  id: string,
  _state: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const validated = parseGroupForm(formData);
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? "Verifique os campos do formulário." };
  }

  try {
    await updateGroup(id, validated.data);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao salvar grupo." };
  }

  revalidatePath(`/grupos/${id}`);
  revalidatePath("/grupos");
  return { success: true };
}
