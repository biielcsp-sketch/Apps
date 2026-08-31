import "server-only";
import { createClient } from "@/lib/supabase/server";
import { displayName } from "@/lib/services/participants.service";
import { dbError } from "@/lib/errors";
import type { Tables } from "@/types/database.types";

export type EnrollmentSourceRow = Tables<"enrollment_sources">;

const DEFAULT_LABEL = "Cadastro público";
const DEFAULT_CODE = "cadastro";

// Um único QR fixo pro sistema inteiro (decisão do usuário — não mais uma
// origem nomeada por evento). Se já existir alguma linha em
// enrollment_sources (inclusive de quando a tela ainda permitia criar
// várias), reaproveita a mais antiga como a canônica; só cria uma nova se
// não existir nenhuma ainda. O código nunca muda depois de criado — é o
// que fica impresso no QR.
export async function getOrCreateDefaultEnrollmentSource(): Promise<EnrollmentSourceRow> {
  const supabase = await createClient();
  const { data: existing, error } = await supabase
    .from("enrollment_sources")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) dbError(error, "enrollmentSources.getDefault");
  if (existing) return existing;

  const { data: created, error: createError } = await supabase
    .from("enrollment_sources")
    .insert({ label: DEFAULT_LABEL, code: DEFAULT_CODE, active: true })
    .select()
    .single();
  if (createError) dbError(createError, "enrollmentSources.createDefault");
  return created;
}

export type EnrollmentRegistration = {
  id: string;
  full_name: string;
  phone: string | null;
  created_at: string;
};

// "Quem se cadastrou" — todo mundo que entrou pelo QR fixo, mais recente
// primeiro.
export async function listEnrollmentRegistrations(code: string): Promise<EnrollmentRegistration[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("participants")
    .select("id, full_name, phone, anonymized_at, created_at")
    .eq("enrollment_source", code)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (error) dbError(error, "enrollmentSources.listRegistrations");
  return (data ?? []).map((row) => ({
    id: row.id,
    full_name: displayName(row),
    phone: row.anonymized_at ? null : row.phone,
    created_at: row.created_at,
  }));
}
