import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/services/profiles.service";
import { logAuditEvent } from "@/lib/services/audit.service";
import { AppError, dbError } from "@/lib/errors";

const BUCKET = "fotos";
const MAX_SIZE_BYTES = 10 * 1024 * 1024;

// Mesma checagem de magic bytes usada no avatar (S6) — o Content-Type do
// navegador é fácil de forjar.
function sniffImageType(bytes: Uint8Array): "image/jpeg" | "image/png" | "image/webp" | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  ) return "image/png";
  if (
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) return "image/webp";
  return null;
}

const EXTENSION_BY_MIME = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

export type CafePhoto = {
  id: string;
  caption: string | null;
  created_at: string;
  group_name: string | null;
  author_name: string | null;
  url: string | null;
};

// Fotos que a usuária logada pode ver — a RLS já decide quais grupos
// entram, aqui só assinamos as URLs (o bucket é privado).
export async function listCafePhotos(limit = 24): Promise<CafePhoto[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cafe_photos")
    .select("id, caption, created_at, storage_path, group:groups(name), author:profiles(full_name)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) dbError(error, "cafePhotos.list");

  return Promise.all(
    (data ?? []).map(async (photo) => {
      const { data: signed } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(photo.storage_path, 60 * 60);
      return {
        id: photo.id,
        caption: photo.caption,
        created_at: photo.created_at,
        group_name: photo.group?.name ?? null,
        author_name: photo.author?.full_name ?? null,
        url: signed?.signedUrl ?? null,
      };
    }),
  );
}

// Os cafés em que a usuária logada pode publicar: os grupos que ela
// lidera (líder/co-líder). Admin recebe todos; participante e anfitriã,
// nenhum — elas só visualizam o mural.
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
  if (error) dbError(error, "cafePhotos.listGroupsICanPostTo");
  return data ?? [];
}

export async function uploadCafePhoto(input: { file: File; groupId: string; caption?: string | null }) {
  const profile = await getCurrentProfile();
  if (!profile) throw new AppError("Sessão expirada. Faça login novamente.");

  const { file } = input;
  if (file.size === 0) throw new AppError("Selecione uma foto.");
  if (file.size > MAX_SIZE_BYTES) throw new AppError("A foto precisa ter no máximo 10MB.");

  const bytes = new Uint8Array(await file.arrayBuffer());
  const mime = sniffImageType(bytes);
  if (!mime) throw new AppError("Arquivo inválido. Envie uma imagem JPEG, PNG ou WEBP.");

  // Nome sempre gerado pelo sistema, dentro da pasta do grupo.
  const storagePath = `${input.groupId}/${crypto.randomUUID()}.${EXTENSION_BY_MIME[mime]}`;

  const supabase = await createClient();
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file, { contentType: mime, upsert: false });
  if (uploadError) dbError(uploadError, "cafePhotos.upload");

  const { data: inserted, error: insertError } = await supabase
    .from("cafe_photos")
    .insert({
      group_id: input.groupId,
      author_profile_id: profile.id,
      storage_path: storagePath,
      caption: input.caption?.trim() || null,
    })
    .select("id")
    .single();

  if (insertError) {
    // Sem a linha, o arquivo viraria órfão no bucket.
    await supabase.storage.from(BUCKET).remove([storagePath]);
    dbError(insertError, "cafePhotos.insert");
  }

  await logAuditEvent({
    action: "cafe_photo.upload",
    entity: "cafe_photos",
    entityId: inserted!.id,
  });
}

export async function deleteCafePhoto(id: string) {
  const supabase = await createClient();
  const { data: photo, error: findError } = await supabase
    .from("cafe_photos")
    .select("id, storage_path")
    .eq("id", id)
    .maybeSingle();

  if (findError) dbError(findError, "cafePhotos.find");
  if (!photo) throw new AppError("Foto não encontrada.");

  // A RLS de delete é quem decide se pode — se não puder, nada é removido.
  const { error: deleteError } = await supabase.from("cafe_photos").delete().eq("id", id);
  if (deleteError) dbError(deleteError, "cafePhotos.delete");

  await supabase.storage.from(BUCKET).remove([photo.storage_path]);
  await logAuditEvent({ action: "cafe_photo.delete", entity: "cafe_photos", entityId: id });
}
