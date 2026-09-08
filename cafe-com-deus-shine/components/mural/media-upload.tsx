"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus } from "lucide-react";
import { createUploadSessionAction, registerMediaAction } from "@/app/actions/cafe-media";
import { Button } from "@/components/ui/Button";

const inputClass =
  "w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary";
const labelClass = "text-sm font-medium text-foreground";

const ACCEPT = "image/jpeg,image/png,image/webp,image/heic,image/heif,video/mp4,video/quicktime,video/webm";
const MAX_IMAGE_MB = 15;
const MAX_VIDEO_MB = 300;

// Envia os bytes direto para o Google e informa o andamento. É XHR e não
// fetch porque só o XHR dá evento de progresso de upload — e sem barra,
// um vídeo de 100MB parece a tela travada.
function uploadWithProgress(
  url: string,
  file: File,
  onProgress: (percent: number) => void,
): Promise<{ id: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url, true);
    xhr.setRequestHeader("Content-Type", file.type);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText) as { id: string });
        } catch {
          reject(new Error("O Google devolveu uma resposta inesperada."));
        }
      } else {
        reject(new Error("O envio do arquivo falhou. Tente de novo."));
      }
    };
    xhr.onerror = () => reject(new Error("Sem conexão com o Google Drive."));
    xhr.send(file);
  });
}

export function MediaUpload({
  postableGroups,
}: {
  postableGroups: { id: string; name: string }[];
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = new FormData(event.currentTarget);
    const groupId = String(form.get("group_id") ?? "");
    const caption = String(form.get("caption") ?? "");

    if (!groupId) return setError("Selecione o café.");
    if (!file) return setError("Escolha uma foto ou um vídeo.");

    const isVideo = file.type.startsWith("video/");
    const limitMb = isVideo ? MAX_VIDEO_MB : MAX_IMAGE_MB;
    if (file.size > limitMb * 1024 * 1024) {
      return setError(
        isVideo
          ? `O vídeo precisa ter no máximo ${MAX_VIDEO_MB}MB.`
          : `A foto precisa ter no máximo ${MAX_IMAGE_MB}MB.`,
      );
    }

    setProgress(0);
    try {
      // 1) O servidor abre a sessão — é ele que tem a credencial do Drive.
      const session = await createUploadSessionAction({
        groupId,
        mimeType: file.type,
        sizeBytes: file.size,
      });
      if ("error" in session) throw new Error(session.error);

      // 2) Os bytes vão direto do navegador para o Google.
      const uploaded = await uploadWithProgress(session.uploadUrl, file, setProgress);

      // 3) O servidor confere o que entrou e grava a publicação.
      const registered = await registerMediaAction({
        groupId,
        driveFileId: uploaded.id,
        caption,
      });
      if (registered.error) throw new Error(registered.error);

      formRef.current?.reset();
      setFile(null);
      setProgress(null);
      router.refresh();
    } catch (e) {
      setProgress(null);
      setError(e instanceof Error ? e.message : "Não foi possível publicar.");
    }
  }

  const enviando = progress !== null;

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5"
    >
      <p className="text-sm font-semibold text-foreground">Publicar no mural</p>

      {postableGroups.length === 1 ? (
        <input type="hidden" name="group_id" value={postableGroups[0].id} />
      ) : (
        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor="group_id">Café</label>
          <select id="group_id" name="group_id" required defaultValue="" className={inputClass}>
            <option value="">Selecione o café...</option>
            {postableGroups.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label className={labelClass} htmlFor="arquivo">Foto ou vídeo</label>
        <input
          id="arquivo"
          type="file"
          accept={ACCEPT}
          required
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className={`${inputClass} file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-sm file:text-foreground`}
        />
        <p className="text-xs text-muted-foreground">
          Foto até {MAX_IMAGE_MB}MB, vídeo até {MAX_VIDEO_MB}MB.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={labelClass} htmlFor="caption">Legenda (opcional)</label>
        <input id="caption" name="caption" maxLength={300} className={inputClass} />
      </div>

      {enviando && (
        <div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            Enviando... {progress}%
          </p>
        </div>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}

      <Button type="submit" disabled={enviando} className="flex items-center gap-2 self-start">
        <ImagePlus size={16} />
        {enviando ? "Enviando..." : "Publicar"}
      </Button>
    </form>
  );
}
