import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/services/profiles.service";
import { logAuditEvent } from "@/lib/services/audit.service";
import {
  createResumableUpload,
  getDriveFileMeta,
  getConfiguredFolderId,
  deleteFromDrive,
} from "@/lib/google-drive";
import { AppError, dbError } from "@/lib/errors";

/* ===================================================================
   Mural do café: fotos e vídeos.

   Os arquivos ficam no Google Drive, nunca no banco. No banco fica só a
   linha que descreve a publicação — id do arquivo no Drive, legenda,
   grupo, quem postou — mais as curtidas e os comentários, que são dados,
   não arquivos.

   A tabela ainda se chama `cafe_photos` porque foi criada antes de o
   mural aceitar vídeo, e renomear tabela com política de RLS em cima
   custa mais do que vale. O código chama de mídia.
   =================================================================== */

const LEGACY_BUCKET = "fotos";
const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const MAX_VIDEO_BYTES = 300 * 1024 * 1024;

const IMAGE_MIMES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
// mp4 e quicktime cobrem Android e iPhone, que é de onde as fotos vêm.
const VIDEO_MIMES = ["video/mp4", "video/quicktime", "video/webm"];

export type MediaType = "image" | "video";

export type CafeMedia = {
  id: string;
  mediaType: MediaType;
  caption: string | null;
  createdAt: string;
  groupId: string;
  groupName: string | null;
  authorId: string;
  authorName: string | null;
  /** Onde o navegador busca o arquivo. Sempre uma rota nossa, nunca o
   *  Drive direto — é ela que confere se quem pediu pode ver. */
  url: string;
  likeCount: number;
  likedByMe: boolean;
  commentCount: number;
};

export type CafeMediaComment = {
  id: string;
  body: string;
  createdAt: string;
  authorName: string | null;
  authorId: string;
};

function extensionFor(mime: string) {
  return (
    {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/heic": "heic",
      "image/heif": "heif",
      "video/mp4": "mp4",
      "video/quicktime": "mov",
      "video/webm": "webm",
    }[mime] ?? "bin"
  );
}

/* ------------------------- Leitura ------------------------- */

type MediaRow = {
  id: string;
  caption: string | null;
  created_at: string;
  media_type: string;
  group_id: string;
  author_profile_id: string;
  group: { name: string } | null;
  author: { full_name: string | null } | null;
  likes: { count: number }[];
  comments: { count: number }[];
};

const MEDIA_SELECT =
  "id, caption, created_at, media_type, group_id, author_profile_id, " +
  "group:groups(name), author:profiles(full_name), " +
  "likes:cafe_photo_likes(count), comments:cafe_photo_comments(count)";

async function decorate(rows: MediaRow[]): Promise<CafeMedia[]> {
  if (rows.length === 0) return [];

  const profile = await getCurrentProfile();
  const supabase = await createClient();

  // Quais destas eu curti — uma consulta só para a página inteira, em vez
  // de uma por publicação.
  let mine = new Set<string>();
  if (profile) {
    const { data } = await supabase
      .from("cafe_photo_likes")
      .select("photo_id")
      .eq("profile_id", profile.id)
      .in(
        "photo_id",
        rows.map((r) => r.id),
      );
    mine = new Set((data ?? []).map((l) => l.photo_id));
  }

  return rows.map((row) => ({
    id: row.id,
    mediaType: row.media_type === "video" ? "video" : "image",
    caption: row.caption,
    createdAt: row.created_at,
    groupId: row.group_id,
    groupName: row.group?.name ?? null,
    authorId: row.author_profile_id,
    authorName: row.author?.full_name ?? null,
    url: `/api/midia/${row.id}`,
    likeCount: row.likes?.[0]?.count ?? 0,
    likedByMe: mine.has(row.id),
    commentCount: row.comments?.[0]?.count ?? 0,
  }));
}

// A RLS já decide quais grupos a usuária enxerga — aqui não se filtra de
// novo, senão a regra passaria a existir em dois lugares.
export async function listCafeMedia(limit = 30): Promise<CafeMedia[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cafe_photos")
    .select(MEDIA_SELECT)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) dbError(error, "cafeMedia.list");
  return decorate((data ?? []) as unknown as MediaRow[]);
}

// A última publicação, para o feed.
export async function getLatestCafeMedia(): Promise<CafeMedia | null> {
  const list = await listCafeMedia(1);
  return list[0] ?? null;
}

// Os cafés em que a usuária pode publicar: os que ela lidera (líder ou
// co-líder). Admin recebe todos; participante e anfitriã, nenhum — elas
// curtem e comentam, mas não postam.
export async function listGroupsICanPostTo(): Promise<{ id: string; name: string }[]> {
  const profile = await getCurrentProfile();
  if (!profile) return [];

  const supabase = await createClient();
  const { data: leader } = await supabase
    .from("leaders")
    .select("id")
    .eq("profile_id", profile.id)
    .maybeSingle();

  const isAdmin = profile.role === "admin" || profile.role === "desenvolvedor";
  if (!leader && !isAdmin) return [];

  let query = supabase.from("groups").select("id, name").order("name");
  if (!isAdmin && leader) query = query.eq("leader_id", leader.id);

  const { data, error } = await query;
  if (error) dbError(error, "cafeMedia.listGroupsICanPostTo");
  return data ?? [];
}

/* ------------------------- Envio -------------------------
   Duas etapas. O servidor abre a sessão de upload (só ele tem o token do
   Drive) e o navegador manda os bytes direto para o Google; depois o
   servidor confere o que entrou e grava a linha. Os bytes nunca passam
   por aqui — é o que permite mandar vídeo de celular. */

async function assertCanPostTo(groupId: string) {
  const allowed = await listGroupsICanPostTo();
  if (!allowed.some((g) => g.id === groupId)) {
    throw new AppError("Você não pode publicar neste café.");
  }
}

export async function createMediaUploadSession(input: {
  groupId: string;
  mimeType: string;
  sizeBytes: number;
}): Promise<{ uploadUrl: string; mediaType: MediaType }> {
  const profile = await getCurrentProfile();
  if (!profile) throw new AppError("Sessão expirada. Faça login novamente.");
  await assertCanPostTo(input.groupId);

  const isImage = IMAGE_MIMES.includes(input.mimeType);
  const isVideo = VIDEO_MIMES.includes(input.mimeType);
  if (!isImage && !isVideo) {
    throw new AppError("Envie uma foto (JPEG, PNG, WEBP, HEIC) ou um vídeo (MP4, MOV, WEBM).");
  }

  const mediaType: MediaType = isVideo ? "video" : "image";
  const limit = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (input.sizeBytes <= 0) throw new AppError("Selecione um arquivo.");
  if (input.sizeBytes > limit) {
    throw new AppError(
      isVideo
        ? "O vídeo precisa ter no máximo 300MB."
        : "A foto precisa ter no máximo 15MB.",
    );
  }

  // Nome sempre gerado aqui: nome vindo do navegador nunca vira nome de
  // arquivo no Drive.
  const fileName = `${input.groupId}-${crypto.randomUUID()}.${extensionFor(input.mimeType)}`;
  const uploadUrl = await createResumableUpload({ mimeType: input.mimeType, fileName });

  return { uploadUrl, mediaType };
}

export async function registerCafeMedia(input: {
  groupId: string;
  driveFileId: string;
  caption?: string | null;
}): Promise<void> {
  const profile = await getCurrentProfile();
  if (!profile) throw new AppError("Sessão expirada. Faça login novamente.");
  await assertCanPostTo(input.groupId);

  // O id veio do navegador, então nada dele é aceito de graça: o arquivo
  // tem que existir, estar na NOSSA pasta e ser de um tipo que aceitamos.
  // O tipo aqui é o que o Google detectou do conteúdo real, o que faz o
  // papel da checagem de magic bytes de quando os bytes passavam por nós.
  const meta = await getDriveFileMeta(input.driveFileId);
  if (!meta) throw new AppError("O arquivo não foi encontrado no Google Drive.");

  if (!meta.parents.includes(getConfiguredFolderId())) {
    throw new AppError("Arquivo fora da pasta do mural.");
  }

  const isImage = IMAGE_MIMES.includes(meta.mimeType);
  const isVideo = VIDEO_MIMES.includes(meta.mimeType);
  if (!isImage && !isVideo) {
    await deleteFromDrive(input.driveFileId);
    throw new AppError("Tipo de arquivo não aceito.");
  }

  const { data: inserted, error } = await supabaseInsertMedia({
    groupId: input.groupId,
    authorId: profile.id,
    driveFileId: meta.id,
    mediaType: isVideo ? "video" : "image",
    mimeType: meta.mimeType,
    fileName: meta.name,
    caption: input.caption?.trim() || null,
  });

  if (error) {
    // Sem a linha, o arquivo viraria órfão na pasta do Drive.
    await deleteFromDrive(input.driveFileId);
    dbError(error, "cafeMedia.insert");
  }

  await logAuditEvent({
    action: "cafe_media.upload",
    entity: "cafe_photos",
    entityId: inserted!.id,
  });
}

async function supabaseInsertMedia(row: {
  groupId: string;
  authorId: string;
  driveFileId: string;
  mediaType: MediaType;
  mimeType: string;
  fileName: string;
  caption: string | null;
}) {
  const supabase = await createClient();
  return supabase
    .from("cafe_photos")
    .insert({
      group_id: row.groupId,
      author_profile_id: row.authorId,
      drive_file_id: row.driveFileId,
      media_type: row.mediaType,
      mime_type: row.mimeType,
      file_name: row.fileName,
      caption: row.caption,
    })
    .select("id")
    .single();
}

export async function deleteCafeMedia(id: string): Promise<void> {
  const supabase = await createClient();
  const { data: media, error: findError } = await supabase
    .from("cafe_photos")
    .select("id, drive_file_id, storage_path")
    .eq("id", id)
    .maybeSingle();

  if (findError) dbError(findError, "cafeMedia.find");
  if (!media) throw new AppError("Publicação não encontrada.");

  // Quem pode apagar é a RLS que diz — se não puder, nada é removido e o
  // arquivo continua onde está.
  const { error: deleteError, count } = await supabase
    .from("cafe_photos")
    .delete({ count: "exact" })
    .eq("id", id);
  if (deleteError) dbError(deleteError, "cafeMedia.delete");
  if (!count) throw new AppError("Você não pode apagar esta publicação.");

  if (media.drive_file_id) await deleteFromDrive(media.drive_file_id);
  if (media.storage_path) await supabase.storage.from(LEGACY_BUCKET).remove([media.storage_path]);

  await logAuditEvent({ action: "cafe_media.delete", entity: "cafe_photos", entityId: id });
}

/* ------------------------- Curtidas ------------------------- */

// Devolve o estado depois da ação, para a tela não precisar recarregar.
export async function toggleCafeMediaLike(
  mediaId: string,
): Promise<{ liked: boolean; likeCount: number }> {
  const profile = await getCurrentProfile();
  if (!profile) throw new AppError("Sessão expirada. Faça login novamente.");

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("cafe_photo_likes")
    .select("photo_id")
    .eq("photo_id", mediaId)
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("cafe_photo_likes")
      .delete()
      .eq("photo_id", mediaId)
      .eq("profile_id", profile.id);
    if (error) dbError(error, "cafeMedia.unlike");
  } else {
    const { error } = await supabase
      .from("cafe_photo_likes")
      .insert({ photo_id: mediaId, profile_id: profile.id });
    if (error) dbError(error, "cafeMedia.like");
  }

  const { count } = await supabase
    .from("cafe_photo_likes")
    .select("photo_id", { count: "exact", head: true })
    .eq("photo_id", mediaId);

  return { liked: !existing, likeCount: count ?? 0 };
}

/* ------------------------- Comentários ------------------------- */

export async function listCafeMediaComments(mediaId: string): Promise<CafeMediaComment[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cafe_photo_comments")
    .select("id, body, created_at, profile_id, author:profiles(full_name)")
    .eq("photo_id", mediaId)
    .order("created_at", { ascending: true });

  if (error) dbError(error, "cafeMedia.listComments");

  return (data ?? []).map((c) => ({
    id: c.id,
    body: c.body,
    createdAt: c.created_at,
    authorName: (c.author as { full_name: string | null } | null)?.full_name ?? null,
    authorId: c.profile_id,
  }));
}

export async function addCafeMediaComment(mediaId: string, body: string): Promise<void> {
  const profile = await getCurrentProfile();
  if (!profile) throw new AppError("Sessão expirada. Faça login novamente.");

  const text = body.trim();
  if (!text) throw new AppError("Escreva um comentário.");
  if (text.length > 1000) throw new AppError("O comentário está muito longo.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("cafe_photo_comments")
    .insert({ photo_id: mediaId, profile_id: profile.id, body: text });
  if (error) dbError(error, "cafeMedia.addComment");
}

export async function deleteCafeMediaComment(commentId: string): Promise<void> {
  const supabase = await createClient();
  const { error, count } = await supabase
    .from("cafe_photo_comments")
    .delete({ count: "exact" })
    .eq("id", commentId);
  if (error) dbError(error, "cafeMedia.deleteComment");
  if (!count) throw new AppError("Você não pode apagar este comentário.");
}

/* ------------------------- Arquivo (usado pela rota /api/midia) ------- */

// Só o necessário para a rota decidir de onde ler. A checagem de quem
// pode ver é o próprio SELECT: se a RLS não deixar, não vem linha.
export async function getMediaFileRef(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cafe_photos")
    .select("id, drive_file_id, storage_path, mime_type, media_type, file_name")
    .eq("id", id)
    .maybeSingle();

  if (error) dbError(error, "cafeMedia.getFileRef");
  return data;
}

export async function getLegacySignedUrl(storagePath: string) {
  const supabase = await createClient();
  const { data } = await supabase.storage
    .from(LEGACY_BUCKET)
    .createSignedUrl(storagePath, 60 * 60);
  return data?.signedUrl ?? null;
}
