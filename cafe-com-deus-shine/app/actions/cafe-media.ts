"use server";

import { revalidatePath } from "next/cache";
import {
  createMediaUploadSession,
  registerCafeMedia,
  deleteCafeMedia,
  toggleCafeMediaLike,
  listCafeMediaComments,
  addCafeMediaComment,
  deleteCafeMediaComment,
} from "@/lib/services/cafe-media.service";
import { toUserMessage } from "@/lib/errors";
import type { CafeMediaComment } from "@/lib/services/cafe-media.service";

function refresh() {
  revalidatePath("/mural");
  revalidatePath("/feed");
}

/* --------------------- Envio em duas etapas --------------------- */

// 1) Abre a sessão de upload. O navegador manda os bytes direto para o
// Google com a URL devolvida aqui.
export async function createUploadSessionAction(input: {
  groupId: string;
  mimeType: string;
  sizeBytes: number;
}): Promise<{ uploadUrl: string } | { error: string }> {
  try {
    const { uploadUrl } = await createMediaUploadSession(input);
    return { uploadUrl };
  } catch (e) {
    return { error: toUserMessage(e, "actions.cafeMedia.session", "Erro ao iniciar o envio.") };
  }
}

// 2) Registra a publicação depois que o arquivo já subiu.
export async function registerMediaAction(input: {
  groupId: string;
  driveFileId: string;
  caption?: string | null;
}): Promise<{ error?: string }> {
  try {
    await registerCafeMedia(input);
  } catch (e) {
    return { error: toUserMessage(e, "actions.cafeMedia.register", "Erro ao publicar.") };
  }
  refresh();
  return {};
}

/* --------------------- Apagar --------------------- */

export async function deleteMediaAction(id: string): Promise<{ error?: string }> {
  try {
    await deleteCafeMedia(id);
  } catch (e) {
    return { error: toUserMessage(e, "actions.cafeMedia.delete", "Erro ao apagar.") };
  }
  refresh();
  return {};
}

/* --------------------- Curtir --------------------- */

// Não chama revalidatePath: a tela já atualiza o coração com a resposta,
// e recarregar a página inteira a cada curtida seria desperdício.
export async function toggleLikeAction(
  id: string,
): Promise<{ liked: boolean; likeCount: number } | { error: string }> {
  try {
    return await toggleCafeMediaLike(id);
  } catch (e) {
    return { error: toUserMessage(e, "actions.cafeMedia.like", "Erro ao curtir.") };
  }
}

/* --------------------- Comentar --------------------- */

export async function listCommentsAction(
  id: string,
): Promise<{ comments: CafeMediaComment[] } | { error: string }> {
  try {
    return { comments: await listCafeMediaComments(id) };
  } catch (e) {
    return { error: toUserMessage(e, "actions.cafeMedia.listComments", "Erro ao carregar.") };
  }
}

export async function addCommentAction(
  id: string,
  body: string,
): Promise<{ comments: CafeMediaComment[] } | { error: string }> {
  try {
    await addCafeMediaComment(id, body);
    return { comments: await listCafeMediaComments(id) };
  } catch (e) {
    return { error: toUserMessage(e, "actions.cafeMedia.addComment", "Erro ao comentar.") };
  }
}

export async function deleteCommentAction(
  commentId: string,
  mediaId: string,
): Promise<{ comments: CafeMediaComment[] } | { error: string }> {
  try {
    await deleteCafeMediaComment(commentId);
    return { comments: await listCafeMediaComments(mediaId) };
  } catch (e) {
    return { error: toUserMessage(e, "actions.cafeMedia.deleteComment", "Erro ao apagar.") };
  }
}
