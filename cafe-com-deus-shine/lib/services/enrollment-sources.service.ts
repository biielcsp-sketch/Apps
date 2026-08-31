import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, isAdminRole } from "@/lib/services/profiles.service";
import { logAuditEvent } from "@/lib/services/audit.service";
import { AppError, dbError } from "@/lib/errors";
import type { Tables } from "@/types/database.types";

export type EnrollmentSourceRow = Tables<"enrollment_sources">;

export async function listEnrollmentSources() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("enrollment_sources")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) dbError(error, "enrollmentSources.list");
  return data ?? [];
}

export async function getEnrollmentSource(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("enrollment_sources").select("*").eq("id", id).single();
  if (error) return null;
  return data;
}

// Vira o `?origem=` na URL pública — sem acento, sem espaço, sem
// maiúscula, só o que sobrevive numa URL sem precisar de encoding.
function slugify(label: string) {
  return label
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function createEnrollmentSource(label: string, customCode?: string) {
  const profile = await getCurrentProfile();
  if (!isAdminRole(profile?.role)) {
    throw new AppError("Apenas administradoras podem criar códigos de inscrição.");
  }

  const code = slugify(customCode?.trim() || label) || `origem-${Date.now()}`;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("enrollment_sources")
    .insert({ label: label.trim(), code, created_by: profile!.id })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new AppError("Já existe um código de inscrição igual a esse — tente outro nome ou edite o código.");
    }
    dbError(error, "enrollmentSources.create");
  }

  await logAuditEvent({
    action: "enrollment_source.create",
    entity: "enrollment_sources",
    entityId: data.id,
    after: { label: data.label, code: data.code },
  });

  return data;
}

// Desativar não apaga inscrições já recebidas por este código — só
// impede novas (Q2 mostra "link expirado" pra quem escanear depois).
export async function setEnrollmentSourceActive(id: string, active: boolean) {
  const profile = await getCurrentProfile();
  if (!isAdminRole(profile?.role)) {
    throw new AppError("Apenas administradoras podem ativar/desativar códigos de inscrição.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("enrollment_sources").update({ active }).eq("id", id);
  if (error) dbError(error, "enrollmentSources.setActive");

  await logAuditEvent({
    action: active ? "enrollment_source.activate" : "enrollment_source.deactivate",
    entity: "enrollment_sources",
    entityId: id,
  });
}
