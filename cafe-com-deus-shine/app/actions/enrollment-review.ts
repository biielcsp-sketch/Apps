"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import {
  approveAndDistribute,
  approveAndDistributeBatch,
  approveEnrollmentManually,
  markEnrollmentAsDuplicateOrSpam,
  type BatchApproveResult,
} from "@/lib/services/enrollment-review.service";
import { getCurrentProfile, isAdminRole } from "@/lib/services/profiles.service";
import { AppError, toUserMessage } from "@/lib/errors";

const REVIEW_PATH = "/participantes/novas-inscricoes";

async function assertAdmin() {
  const profile = await getCurrentProfile();
  if (!isAdminRole(profile?.role)) {
    throw new AppError("Apenas administradoras podem revisar novas inscrições.");
  }
}

export async function approveAndDistributeAction(participantId: string, formData: FormData) {
  await assertAdmin();

  const leaderId = formData.get("leader_id") as string | null;
  const groupId = (formData.get("group_id") as string | null) || null;
  if (!leaderId) throw new AppError("Selecione uma líder.");

  await approveAndDistribute(participantId, leaderId, groupId);
  revalidatePath(REVIEW_PATH);
}

export async function approveEnrollmentManuallyAction(participantId: string) {
  await assertAdmin();
  await approveEnrollmentManually(participantId);
  revalidatePath(REVIEW_PATH);
  revalidatePath("/participantes/aguardando-distribuicao");
}

export async function markEnrollmentAsDuplicateAction(participantId: string, formData: FormData) {
  await assertAdmin();
  const note =
    (formData.get("note") as string | null)?.trim() ||
    "Marcada como duplicata/spam na revisão de novas inscrições.";
  await markEnrollmentAsDuplicateOrSpam(participantId, note);
  revalidatePath(REVIEW_PATH);
}

const BatchItemSchema = z.object({
  participantId: z.uuid(),
  fullName: z.string(),
  leaderId: z.uuid(),
  groupId: z.uuid().nullable(),
});

export type BatchApproveActionState =
  | { status: "done"; results: BatchApproveResult[] }
  | { status: "error"; error: string }
  | undefined;

export async function approveAndDistributeBatchAction(
  _state: BatchApproveActionState,
  formData: FormData,
): Promise<BatchApproveActionState> {
  await assertAdmin();

  const raw = formData.get("payload");
  let parsedJson: unknown;
  try {
    parsedJson = typeof raw === "string" ? JSON.parse(raw) : null;
  } catch {
    return { status: "error", error: "Seleção inválida. Marque as participantes novamente." };
  }

  const validated = z.array(BatchItemSchema).min(1).safeParse(parsedJson);
  if (!validated.success) {
    return { status: "error", error: "Selecione ao menos uma participante para aprovar em lote." };
  }

  try {
    const results = await approveAndDistributeBatch(validated.data);
    revalidatePath(REVIEW_PATH);
    return { status: "done", results };
  } catch (e) {
    return {
      status: "error",
      error: toUserMessage(e, "actions.enrollmentReview.batch", "Não foi possível processar o lote. Tente novamente."),
    };
  }
}
