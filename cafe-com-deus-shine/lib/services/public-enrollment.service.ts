import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkPublicEnrollmentRateLimit } from "@/lib/rate-limit";
import { AppError, dbError } from "@/lib/errors";
import type { PublicEnrollmentInput } from "@/lib/validators/public-enrollment.schema";
import type { TablesInsert } from "@/types/database.types";

export type PublicEnrollmentResult = "created" | "duplicate" | "discarded";

// Q2: a rota pública /cadastro valida `?origem=` contra isto ANTES de
// mostrar o formulário — link sem origem rastreável não deve permitir
// cadastro. `enrollment_sources` só tem policy de RLS para `authenticated`
// (admin CRUD, líder select) — quem acessa esta página não tem sessão
// nenhuma, por isso o client admin, não o normal.
export async function validateEnrollmentSource(code: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("enrollment_sources")
    .select("id")
    .eq("code", code)
    .eq("active", true)
    .maybeSingle();
  if (error) dbError(error, "publicEnrollment.validateSource");
  return Boolean(data);
}

// Q2: texto vigente dos termos para exibir na própria tela pública, antes
// do aceite. `app_terms_versions` também só libera SELECT para
// `authenticated` — o conteúdo em si é para ser público nesta tela
// específica (é para isso que ela existe), mas a tabela não é, por isso
// client admin aqui também.
export async function getActiveTermsForPublicEnrollment() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("app_terms_versions")
    .select("version, content")
    .order("published_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) dbError(error, "publicEnrollment.getActiveTerms");
  return data;
}

// Reaproveitado tanto pelo autocadastro (abaixo) quanto pela tela de
// revisão de novas inscrições (Q3) — a mesma checagem de duplicata não
// pode ter duas implementações divergentes.
export async function findDuplicateParticipantByPhone(
  phone: string,
  excludeParticipantId?: string,
) {
  const admin = createAdminClient();
  let query = admin
    .from("participants")
    .select("id")
    .eq("phone", phone.trim())
    .neq("status", "inativa")
    .is("deleted_at", null);
  if (excludeParticipantId) {
    query = query.neq("id", excludeParticipantId);
  }
  const { data, error } = await query.maybeSingle();
  if (error) dbError(error, "publicEnrollment.findDuplicate");
  return data;
}

// Único ponto do sistema onde alguém sem sessão autenticada escreve no
// banco (decisão travada no CLAUDE.md). NUNCA via policy de RLS `anon` em
// `participants` — RLS restringe linha, não coluna, e uma policy anônima
// de INSERT deixaria qualquer visitante escrever `status`,
// `current_leader_id` ou `admin_notes` direto pela API do Supabase,
// ignorando o formulário (ver seção 4 do documento de arquitetura). Por
// isso sempre `service_role`, com o payload montado campo a campo.
export async function submitPublicEnrollment(
  input: PublicEnrollmentInput,
  ip: string,
): Promise<PublicEnrollmentResult> {
  // 1. Honeypot: só bot preenche esse campo (escondido na tela, Q2). Quem
  // chama isto deve responder sucesso genérico de qualquer forma — nunca
  // ensinar o bot a se adaptar revelando que foi descartado.
  if (input.website) {
    return "discarded";
  }

  // 2. Rate limit por IP — pré-autenticado, reaproveita o núcleo do S4
  // (/lib/rate-limit.ts).
  const allowed = await checkPublicEnrollmentRateLimit(ip);
  if (!allowed) {
    throw new AppError("Muitas tentativas. Aguarde alguns minutos e tente novamente.");
  }

  // 3. Duplicata por telefone (status != 'inativa') — mesma pessoa
  // escaneando o QR de novo não deve virar um segundo cadastro.
  const existing = await findDuplicateParticipantByPhone(input.phone);
  if (existing) {
    return "duplicate";
  }

  const admin = createAdminClient();
  const terms = await getActiveTermsForPublicEnrollment();

  // 4. Payload montado campo a campo — NUNCA spread do body recebido.
  // status, consent_method e enrollment_source são decididos aqui, nunca
  // vêm do formulário (item 6).
  const payload: TablesInsert<"participants"> = {
    full_name: input.full_name.trim(),
    preferred_name: input.preferred_name?.trim() || null,
    phone: input.phone.trim(),
    whatsapp: input.whatsapp?.trim() || null,
    email: input.email?.trim() || null,
    birth_date: input.birth_date || null,
    city: input.city?.trim() || null,
    neighborhood: input.neighborhood?.trim() || null,
    address: input.address?.trim() || null,
    availability_days: input.availability_days ?? null,
    availability_period: input.availability_period ?? null,
    location_preference: input.location_preference?.trim() || null,
    home_meeting_ok: input.home_meeting_ok ?? true,
    other_notes: input.other_notes?.trim() || null,
    status: "nova_inscricao",
    consent_accepted_at: new Date().toISOString(),
    consent_version: terms?.version ?? null,
    consent_method: "autocadastro",
    enrollment_source: input.code,
  };

  // 5. Insert com service_role — comentário acima explica por que RLS/anon
  // não é usado aqui.
  const { error: insertError } = await admin.from("participants").insert(payload);
  if (insertError) dbError(insertError, "publicEnrollment.insert");

  return "created";
}
