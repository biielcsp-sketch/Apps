import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, isAdminRole } from "@/lib/services/profiles.service";
import { logAuditEvent } from "@/lib/services/audit.service";
import { AppError, dbError } from "@/lib/errors";

const BUCKET = "estudos";
const MAX_SIZE_BYTES = 15 * 1024 * 1024;

// Mesma disciplina do upload de avatar (S6): o Content-Type que o navegador
// manda é fácil de forjar, então conferimos os magic bytes de verdade e só
// aceitamos o que a lista permite.
const SIGNATURES: { mime: string; ext: string; test: (b: Uint8Array) => boolean }[] = [
  {
    mime: "application/pdf",
    ext: "pdf",
    test: (b) => b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46,
  },
  {
    // .docx / .xlsx são zip (PK\x03\x04) — a distinção fina entre eles vem
    // da extensão declarada, já validada contra a lista de permitidos.
    mime: "application/zip",
    ext: "zip",
    test: (b) => b[0] === 0x50 && b[1] === 0x4b && (b[2] === 0x03 || b[2] === 0x05 || b[2] === 0x07),
  },
  {
    // .doc / .xls antigos (OLE2)
    mime: "application/x-ole-storage",
    ext: "ole",
    test: (b) =>
      b[0] === 0xd0 && b[1] === 0xcf && b[2] === 0x11 && b[3] === 0xe0 &&
      b[4] === 0xa1 && b[5] === 0xb1 && b[6] === 0x1a && b[7] === 0xe1,
  },
  {
    mime: "image/jpeg",
    ext: "jpg",
    test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    mime: "image/png",
    ext: "png",
    test: (b) =>
      b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
      b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a,
  },
  {
    mime: "image/webp",
    ext: "webp",
    test: (b) =>
      b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
      b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50,
  },
];

const ALLOWED_EXTENSIONS = ["pdf", "doc", "docx", "xls", "xlsx", "jpg", "jpeg", "png", "webp"];

const MIME_BY_EXTENSION: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export type StudyMaterial = {
  id: string;
  title: string;
  description: string | null;
  reference_month: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  storage_path: string;
  created_at: string;
};

// Lista os materiais do mês. A policy de SELECT libera para toda usuária
// autenticada — líder, co-líder, anfitriã e participante veem o mesmo.
export async function listStudyMaterials(): Promise<StudyMaterial[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("study_materials")
    .select("id, title, description, reference_month, file_name, mime_type, size_bytes, storage_path, created_at")
    .order("reference_month", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) dbError(error, "studyMaterials.list");
  return data ?? [];
}

// Link temporário de download — o bucket é privado, então nada é servido
// por URL pública; cada acesso gera uma URL assinada de curta duração.
export async function getStudyMaterialUrl(storagePath: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(storagePath, 60 * 10);
  if (error) dbError(error, "studyMaterials.signedUrl");
  return data?.signedUrl ?? null;
}

export async function uploadStudyMaterial(input: {
  file: File;
  title: string;
  description?: string | null;
  referenceMonth: string; // "AAAA-MM"
}) {
  const profile = await getCurrentProfile();
  if (!isAdminRole(profile?.role)) {
    throw new AppError("Apenas administradoras podem enviar o estudo do mês.");
  }

  const { file } = input;
  if (file.size === 0) throw new AppError("Selecione um arquivo.");
  if (file.size > MAX_SIZE_BYTES) {
    throw new AppError("O arquivo precisa ter no máximo 15MB.");
  }

  const declaredExt = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_EXTENSIONS.includes(declaredExt)) {
    throw new AppError("Formato não aceito. Envie PDF, Word, Excel ou imagem.");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const matched = SIGNATURES.find((s) => s.test(bytes));
  if (!matched) {
    throw new AppError("Arquivo inválido. Envie um PDF, Word, Excel ou imagem de verdade.");
  }

  const storageMime = MIME_BY_EXTENSION[declaredExt];
  // Nome de arquivo sempre gerado pelo sistema — o nome original vai só
  // para a coluna file_name, exibida na tela, nunca para o caminho.
  const storagePath = `${input.referenceMonth}/${crypto.randomUUID()}.${declaredExt}`;

  const supabase = await createClient();
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file, { contentType: storageMime, upsert: false });

  if (uploadError) dbError(uploadError, "studyMaterials.upload");

  const { data: inserted, error: insertError } = await supabase
    .from("study_materials")
    .insert({
      title: input.title.trim(),
      description: input.description?.trim() || null,
      reference_month: `${input.referenceMonth}-01`,
      storage_path: storagePath,
      file_name: file.name,
      mime_type: storageMime,
      size_bytes: file.size,
      uploaded_by: profile!.id,
    })
    .select("id")
    .single();

  if (insertError) {
    // Não deixa arquivo órfão no bucket se a linha não entrou.
    await supabase.storage.from(BUCKET).remove([storagePath]);
    dbError(insertError, "studyMaterials.insert");
  }

  await logAuditEvent({
    action: "study_material.upload",
    entity: "study_materials",
    entityId: inserted!.id,
    after: { title: input.title, reference_month: input.referenceMonth },
  });
}

export async function deleteStudyMaterial(id: string) {
  const profile = await getCurrentProfile();
  if (!isAdminRole(profile?.role)) {
    throw new AppError("Apenas administradoras podem remover o estudo do mês.");
  }

  const supabase = await createClient();
  const { data: material, error: findError } = await supabase
    .from("study_materials")
    .select("id, storage_path")
    .eq("id", id)
    .maybeSingle();

  if (findError) dbError(findError, "studyMaterials.find");
  if (!material) throw new AppError("Material não encontrado.");

  const { error: deleteError } = await supabase.from("study_materials").delete().eq("id", id);
  if (deleteError) dbError(deleteError, "studyMaterials.delete");

  await supabase.storage.from(BUCKET).remove([material.storage_path]);

  await logAuditEvent({
    action: "study_material.delete",
    entity: "study_materials",
    entityId: id,
  });
}
