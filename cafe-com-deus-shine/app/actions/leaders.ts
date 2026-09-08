"use server";

import { revalidatePath } from "next/cache";
import { LeaderCreateSchema, LeaderUpdateSchema } from "@/lib/validators/leader.schema";
import {
  createLeaderAccount,
  updateLeader,
  setLeaderStatus,
  deleteLeader,
} from "@/lib/services/leaders.service";
import { getCurrentProfile, isAdminRole } from "@/lib/services/profiles.service";
import { AppError, toUserMessage } from "@/lib/errors";
import type { FormActionState } from "@/app/actions/participants";

// O cadastro de líder não redireciona mais ao terminar: a tela precisa
// ficar de pé mostrando o que a pastora tem que enviar para a líder. A
// senha NÃO volta daqui de propósito — o formulário já a tem no próprio
// estado, então não há motivo para ela atravessar a rede uma segunda vez.
export type LeaderCreateState =
  | { status: "error"; error: string }
  | { status: "created"; leaderId: string; fullName: string; email: string }
  | undefined;

function readOptionalString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() !== "" ? value : undefined;
}

export async function createLeaderAction(
  _state: LeaderCreateState,
  formData: FormData,
): Promise<LeaderCreateState> {
  const profile = await getCurrentProfile();
  if (!isAdminRole(profile?.role)) {
    return { status: "error", error: "Apenas administradoras podem cadastrar líderes." };
  }

  const validated = LeaderCreateSchema.safeParse({
    full_name: formData.get("full_name"),
    email: formData.get("email"),
    password: formData.get("password"),
    phone: readOptionalString(formData, "phone"),
    whatsapp: readOptionalString(formData, "whatsapp"),
    city: readOptionalString(formData, "city"),
    neighborhood: readOptionalString(formData, "neighborhood"),
    meeting_address: readOptionalString(formData, "meeting_address"),
    region: readOptionalString(formData, "region"),
    max_capacity: formData.get("max_capacity"),
    role: formData.get("role") || undefined,
  });

  if (!validated.success) {
    return {
      status: "error",
      error: validated.error.issues[0]?.message ?? "Verifique os campos do formulário.",
    };
  }

  let leader;
  try {
    leader = await createLeaderAccount(validated.data);
  } catch (e) {
    return {
      status: "error",
      error: toUserMessage(e, "actions.leaders.create", "Erro ao cadastrar líder."),
    };
  }

  revalidatePath("/liderancas");
  return {
    status: "created",
    leaderId: leader.id,
    fullName: validated.data.full_name,
    email: validated.data.email,
  };
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
    return { error: toUserMessage(e, "actions.leaders.update", "Erro ao salvar.") };
  }

  revalidatePath(`/liderancas/${id}`);
  return { success: true };
}

export async function toggleLeaderStatusAction(id: string, currentStatus: "ativa" | "inativa") {
  const profile = await getCurrentProfile();
  if (!isAdminRole(profile?.role)) throw new AppError("Apenas administradoras podem inativar líderes.");

  await setLeaderStatus(id, currentStatus === "ativa" ? "inativa" : "ativa");
  revalidatePath("/liderancas");
  revalidatePath(`/liderancas/${id}`);
}

export async function deleteLeaderAction(id: string) {
  const profile = await getCurrentProfile();
  if (!isAdminRole(profile?.role)) throw new AppError("Apenas administradoras podem excluir líderes.");

  const result = await deleteLeader(id);
  revalidatePath("/liderancas");
  return result;
}
