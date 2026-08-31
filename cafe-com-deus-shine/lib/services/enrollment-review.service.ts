import "server-only";
import { createClient } from "@/lib/supabase/server";
import { suggestLeaders, confirmDistribution, type LeaderSuggestion } from "@/lib/services/distribution.service";
import { findDuplicateParticipantByPhone } from "@/lib/services/public-enrollment.service";
import { changeParticipantStatus, updateParticipantAdminFields } from "@/lib/services/participants.service";
import { AppError, dbError } from "@/lib/errors";

export type EnrollmentReviewItem = {
  id: string;
  full_name: string;
  phone: string | null;
  city: string | null;
  neighborhood: string | null;
  enrollment_date: string;
  duplicate: boolean;
  incompleteData: boolean;
  suggestions: LeaderSuggestion[];
  eligibleCount: number;
};

export type ClassifiedEnrollments = {
  ready: EnrollmentReviewItem[];
  needsAttention: EnrollmentReviewItem[];
};

// Q3: pré-seleção calculada ao abrir a tela (não no momento da inscrição).
// Reaproveita suggestLeaders() da Fase 4 e findDuplicateParticipantByPhone()
// do autocadastro — nenhum dos dois é reimplementado aqui.
export async function listNewEnrollmentsForReview(): Promise<ClassifiedEnrollments> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("participants")
    .select("id, full_name, phone, city, neighborhood, availability_days, availability_period, enrollment_date")
    .eq("status", "nova_inscricao")
    .order("enrollment_date", { ascending: true });
  if (error) dbError(error, "enrollmentReview.list");

  const items: EnrollmentReviewItem[] = [];
  for (const p of data ?? []) {
    const [duplicateRow, distribution] = await Promise.all([
      p.phone ? findDuplicateParticipantByPhone(p.phone, p.id) : Promise.resolve(null),
      suggestLeaders(p.id),
    ]);

    // Campos mínimos que o motor de distribuição precisa pra calcular
    // score de verdade (item 1 do Q3) — sem isso a sugestão sai no escuro.
    const hasAvailability =
      (p.availability_days?.length ?? 0) > 0 || (p.availability_period?.length ?? 0) > 0;
    const hasLocation = Boolean(p.city?.trim() || p.neighborhood?.trim());

    items.push({
      id: p.id,
      full_name: p.full_name,
      phone: p.phone,
      city: p.city,
      neighborhood: p.neighborhood,
      enrollment_date: p.enrollment_date,
      duplicate: Boolean(duplicateRow),
      incompleteData: !hasAvailability || !hasLocation,
      suggestions: distribution.suggestions,
      eligibleCount: distribution.eligibleCount,
    });
  }

  // "Pronta para aprovar": sem duplicata, sem dados incompletos, e com
  // pelo menos 1 líder elegível com score calculado.
  const ready = items.filter((i) => !i.duplicate && !i.incompleteData && i.suggestions.length > 0);
  const needsAttention = items.filter((i) => !ready.includes(i));

  return { ready, needsAttention };
}

// "Aprovar e Distribuir": muda status para aguardando_distribuicao
// (participant_status_history grava a transição, igual aconteceria se
// tivesse passado pela tela normal), depois roda a MESMA confirmação de
// distribuição da Fase 4 — nunca duplica a lógica de transição de status
// aqui. Se o segundo passo falhar, a participante fica parada em
// 'aguardando_distribuicao' (fila normal da Fase 4) em vez de num estado
// quebrado — não é uma transação de banco, mas não há estado inconsistente
// possível entre os dois passos.
export async function approveAndDistribute(participantId: string, leaderId: string, groupId: string | null) {
  await changeParticipantStatus(participantId, "aguardando_distribuicao", "Aprovada na revisão de novas inscrições.");
  await confirmDistribution(participantId, leaderId, groupId);
}

export type BatchApproveInput = {
  participantId: string;
  fullName: string;
  leaderId: string;
  groupId: string | null;
};

export type BatchApproveResult = {
  participantId: string;
  fullName: string;
  ok: boolean;
  error?: string;
};

// Em lote: cada item é tratado de forma independente e o resultado de
// TODOS é reportado — nunca um "sucesso genérico" que esconde qual falhou
// e por quê (condição de parada explícita do Q3).
export async function approveAndDistributeBatch(items: BatchApproveInput[]): Promise<BatchApproveResult[]> {
  const results: BatchApproveResult[] = [];
  for (const item of items) {
    try {
      await approveAndDistribute(item.participantId, item.leaderId, item.groupId);
      results.push({ participantId: item.participantId, fullName: item.fullName, ok: true });
    } catch (e) {
      results.push({
        participantId: item.participantId,
        fullName: item.fullName,
        ok: false,
        error: e instanceof AppError ? e.message : "Erro inesperado ao aprovar.",
      });
    }
  }
  return results;
}

// "Precisa de atenção" → aprovar manualmente: só avança pra
// aguardando_distribuicao e segue o fluxo normal da Fase 4 (tela de
// distribuição), sem distribuição automática.
export async function approveEnrollmentManually(participantId: string) {
  await changeParticipantStatus(
    participantId,
    "aguardando_distribuicao",
    "Aprovada manualmente na revisão de novas inscrições.",
  );
}

// "Precisa de atenção" → marcar como duplicata/spam: status 'inativa' com
// admin_notes, nunca deleta a linha (item 34 da especificação original).
export async function markEnrollmentAsDuplicateOrSpam(participantId: string, note: string) {
  await changeParticipantStatus(participantId, "inativa", note);
  await updateParticipantAdminFields(participantId, { admin_notes: note });
}
