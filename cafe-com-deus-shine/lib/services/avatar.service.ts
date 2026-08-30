import "server-only";
import { createClient } from "@/lib/supabase/server";

const MAX_SIZE_BYTES = 2 * 1024 * 1024;

const ALLOWED_EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

// Nunca confiamos só no Content-Type que o navegador manda — é fácil
// forjar (renomear um .exe pra .jpg troca a extensão e o que o browser
// reporta, não o conteúdo do arquivo). Conferimos os magic bytes de
// verdade, sem precisar de nenhuma dependência nova.
function sniffImageType(bytes: Uint8Array): keyof typeof ALLOWED_EXTENSIONS | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  return null;
}

// Faz upload do avatar da PRÓPRIA usuária logada. Nome de arquivo sempre
// gerado pelo sistema (`avatar.<ext>` dentro da pasta do próprio uid) —
// nunca o nome original enviado pelo navegador.
export async function uploadMyAvatar(file: File) {
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error("A imagem precisa ter no máximo 2MB.");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const sniffed = sniffImageType(bytes);
  if (!sniffed) {
    throw new Error("Arquivo inválido. Envie uma imagem JPEG, PNG ou WEBP de verdade.");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sessão expirada. Faça login novamente.");

  const ext = ALLOWED_EXTENSIONS[sniffed];
  const path = `${user.id}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, bytes, { contentType: sniffed, upsert: true });
  if (uploadError) throw new Error(uploadError.message);

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ avatar_url: path })
    .eq("id", user.id);
  if (profileError) throw new Error(profileError.message);

  return path;
}

// Bucket é privado — nunca uma URL pública permanente. Gera uma URL
// assinada de curta duração sob demanda para exibir a foto.
export async function getMyAvatarSignedUrl(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("id", user.id)
    .single();
  if (!profile?.avatar_url) return null;

  const { data, error } = await supabase.storage
    .from("avatars")
    .createSignedUrl(profile.avatar_url, 60 * 60);
  if (error) return null;

  return data.signedUrl;
}
