"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile, isAdminRole } from "@/lib/services/profiles.service";
import { updateGroupLocation, clearGroupLocation } from "@/lib/services/groups.service";
import { toUserMessage } from "@/lib/errors";

export type LocationActionResult = { error?: string } | undefined;

export async function updateGroupLocationAction(
  groupId: string,
  latitude: number,
  longitude: number,
): Promise<LocationActionResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Sessão expirada. Faça login novamente." };
  // Checagem de papel redundante com a RLS de `groups` (defesa em
  // profundidade) — a barreira real continua sendo a policy
  // "groups_leader_update" (admin/desenvolvedor ou a própria líder do
  // grupo), que já impede uma líder de tocar num café que não é dela.
  if (!isAdminRole(profile.role) && profile.role !== "lider") {
    return { error: "Você não tem permissão para editar a localização de um café." };
  }
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return { error: "Coordenadas inválidas." };
  }

  try {
    await updateGroupLocation(groupId, latitude, longitude);
  } catch (e) {
    return { error: toUserMessage(e, "actions.groupLocation.update", "Erro ao salvar a localização.") };
  }

  revalidatePath("/cafes/localizacao");
  revalidatePath(`/cafes/localizacao/${groupId}`);
  return undefined;
}

export async function clearGroupLocationAction(groupId: string): Promise<LocationActionResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Sessão expirada. Faça login novamente." };
  if (!isAdminRole(profile.role) && profile.role !== "lider") {
    return { error: "Você não tem permissão para editar a localização de um café." };
  }

  try {
    await clearGroupLocation(groupId);
  } catch (e) {
    return { error: toUserMessage(e, "actions.groupLocation.clear", "Erro ao remover a localização.") };
  }

  revalidatePath("/cafes/localizacao");
  revalidatePath(`/cafes/localizacao/${groupId}`);
  return undefined;
}
