"use client";

import { useActionState, useRef, type ChangeEvent } from "react";
import { uploadAvatarAction, removeAvatarAction, type AvatarActionState } from "@/app/actions/avatar";
import { Button } from "@/components/ui/Button";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 2 * 1024 * 1024;

export function AvatarUpload({
  currentSignedUrl,
  initials,
}: {
  currentSignedUrl?: string | null;
  initials?: string;
}) {
  const [uploadState, uploadAction, uploading] = useActionState<AvatarActionState, FormData>(
    uploadAvatarAction,
    undefined,
  );
  const [removeState, removeAction, removing] = useActionState<AvatarActionState, FormData>(
    removeAvatarAction,
    undefined,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Validação client-side é só UX (feedback imediato) — a barreira real é
  // no service (magic bytes + tamanho), que roda de novo no servidor.
  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      e.target.value = "";
      window.alert("Envie uma imagem JPEG, PNG ou WEBP.");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      e.target.value = "";
      window.alert("A imagem precisa ter no máximo 2MB.");
      return;
    }
    formRef.current?.requestSubmit();
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {currentSignedUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- URL assinada e temporária, não vale a pena passar pelo otimizador do next/image
        <img
          src={currentSignedUrl}
          alt="Foto de perfil"
          className="h-24 w-24 rounded-full border border-border object-cover"
        />
      ) : (
        <div className="flex h-24 w-24 items-center justify-center rounded-full border border-border bg-muted text-2xl font-semibold text-muted-foreground">
          {initials || "?"}
        </div>
      )}

      <form ref={formRef} action={uploadAction}>
        <input
          ref={inputRef}
          type="file"
          name="avatar"
          accept={ACCEPTED_TYPES.join(",")}
          onChange={handleChange}
          className="hidden"
        />
      </form>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? "Enviando..." : "Trocar foto"}
        </Button>
        {currentSignedUrl && (
          <form action={removeAction}>
            <Button type="submit" variant="secondary" disabled={removing}>
              {removing ? "Removendo..." : "Remover"}
            </Button>
          </form>
        )}
      </div>

      {uploadState?.error && <p className="text-sm text-danger">{uploadState.error}</p>}
      {removeState?.error && <p className="text-sm text-danger">{removeState.error}</p>}
    </div>
  );
}
