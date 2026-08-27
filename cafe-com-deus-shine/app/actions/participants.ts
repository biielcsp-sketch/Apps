"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  ParticipantCreateSchema,
  ParticipantPersonalSchema,
  ParticipantAdminSchema,
} from "@/lib/validators/participant.schema";
import {
  createParticipant,
  updateParticipantPersonal,
  updateParticipantAdminFields,
  changeParticipantStatus,
} from "@/lib/services/participants.service";
import { requestErasure, processErasure } from "@/lib/services/erasure.service";
import { getCurrentProfile } from "@/lib/services/profiles.service";
import type { Enums } from "@/types/database.types";

export type FormActionState = { error?: string; success?: boolean } | undefined;

function readArray(formData: FormData, key: string) {
  const values = formData.getAll(key).map(String).filter(Boolean);
  return values.length > 0 ? values : undefined;
}

function readOptionalString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() !== "" ? value : undefined;
}

export async function createParticipantAction(
  _state: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const profile = await getCurrentProfile();
  if (profile?.role !== "admin") {
    return { error: "Apenas administradoras podem cadastrar participantes." };
  }

  const validated = ParticipantCreateSchema.safeParse({
    full_name: formData.get("full_name"),
    preferred_name: readOptionalString(formData, "preferred_name"),
    phone: readOptionalString(formData, "phone"),
    whatsapp: readOptionalString(formData, "whatsapp"),
    email: readOptionalString(formData, "email"),
    birth_date: readOptionalString(formData, "birth_date"),
    city: readOptionalString(formData, "city"),
    neighborhood: readOptionalString(formData, "neighborhood"),
    address: readOptionalString(formData, "address"),
    availability_days: readArray(formData, "availability_days"),
    availability_period: readArray(formData, "availability_period"),
    location_preference: readOptionalString(formData, "location_preference"),
    home_meeting_ok: formData.get("home_meeting_ok") === "on",
    other_notes: readOptionalString(formData, "other_notes"),
    admin_notes: readOptionalString(formData, "admin_notes"),
    enrollment_source: readOptionalString(formData, "enrollment_source"),
    current_leader_id: readOptionalString(formData, "current_leader_id"),
    consent_accepted: formData.get("consent_accepted") === "on",
  });

  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? "Verifique os campos do formulário." };
  }

  let created;
  try {
    created = await createParticipant(validated.data);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao cadastrar participante." };
  }

  revalidatePath("/participantes");
  redirect(`/participantes/${created.id}`);
}

export async function updateParticipantPersonalAction(
  id: string,
  isLeaderRoute: boolean,
  _state: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const validated = ParticipantPersonalSchema.safeParse({
    full_name: formData.get("full_name"),
    preferred_name: readOptionalString(formData, "preferred_name"),
    phone: readOptionalString(formData, "phone"),
    whatsapp: readOptionalString(formData, "whatsapp"),
    email: readOptionalString(formData, "email"),
    birth_date: readOptionalString(formData, "birth_date"),
    city: readOptionalString(formData, "city"),
    neighborhood: readOptionalString(formData, "neighborhood"),
    address: readOptionalString(formData, "address"),
    availability_days: readArray(formData, "availability_days"),
    availability_period: readArray(formData, "availability_period"),
    location_preference: readOptionalString(formData, "location_preference"),
    home_meeting_ok: formData.get("home_meeting_ok") === "on",
    other_notes: readOptionalString(formData, "other_notes"),
  });

  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? "Verifique os campos do formulário." };
  }

  try {
    await updateParticipantPersonal(id, validated.data);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao salvar." };
  }

  revalidatePath(isLeaderRoute ? `/minhas-participantes/${id}` : `/participantes/${id}`);
  redirect(isLeaderRoute ? `/minhas-participantes/${id}` : `/participantes/${id}`);
}

export async function updateParticipantAdminAction(
  id: string,
  _state: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const profile = await getCurrentProfile();
  if (profile?.role !== "admin") {
    return { error: "Apenas administradoras podem editar estes campos." };
  }

  const validated = ParticipantAdminSchema.pick({ admin_notes: true, enrollment_source: true }).safeParse({
    admin_notes: readOptionalString(formData, "admin_notes"),
    enrollment_source: readOptionalString(formData, "enrollment_source"),
  });
  if (!validated.success) {
    return { error: "Verifique os campos administrativos." };
  }

  try {
    await updateParticipantAdminFields(id, validated.data);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao salvar." };
  }

  revalidatePath(`/participantes/${id}`);
  return { success: true };
}

export async function changeParticipantStatusAction(id: string, formData: FormData) {
  const profile = await getCurrentProfile();
  if (profile?.role !== "admin") throw new Error("Apenas administradoras podem alterar o status.");

  const status = formData.get("status") as Enums<"participant_status"> | null;
  const note = readOptionalString(formData, "note") ?? null;
  if (!status) throw new Error("Selecione um status.");

  await changeParticipantStatus(id, status, note);
  revalidatePath(`/participantes/${id}`);
}

export async function requestErasureAction(
  participantId: string,
  isLeaderRoute: boolean,
  _state: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const reason = readOptionalString(formData, "reason");
  if (!reason) return { error: "Informe o motivo da solicitação." };

  try {
    await requestErasure(participantId, reason);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao solicitar exclusão." };
  }

  revalidatePath(isLeaderRoute ? `/minhas-participantes/${participantId}` : `/participantes/${participantId}`);
  return { success: true };
}

export async function processErasureAction(requestId: string) {
  const profile = await getCurrentProfile();
  if (profile?.role !== "admin") throw new Error("Apenas administradoras podem processar exclusões.");

  await processErasure(requestId);
  revalidatePath("/participantes/solicitacoes-exclusao");
}
