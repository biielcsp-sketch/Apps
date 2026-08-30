"use client";

import { useActionState } from "react";
import { uploadAvatarAction, type AvatarActionState } from "@/app/actions/avatar";
import { Button } from "@/components/ui/Button";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 2 * 1024 * 1024;

export function AvatarUpload({ currentSignedUrl }: { currentSignedUrl?: string | null }) {
  const [state, action, pending] = useActionState<AvatarActionState, FormData>(
    uploadAvatarAction,
    undefined,
  );

  // Validação client-side é só UX (feedback imediato) — a barreira real é
  // no service (magic bytes + tamanho), que roda de novo no servidor.
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
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
    }
  }

  return (
    <form action={action} className="flex flex-col gap-3">
      {currentSignedUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- URL assinada e temporária, não vale a pena passar pelo otimizador do next/image
        <img
          src={currentSignedUrl}
          alt="Foto de perfil"
          className="h-20 w-20 rounded-full border border-border object-cover"
        />
      )}
      <input
        type="file"
        name="avatar"
        accept={ACCEPTED_TYPES.join(",")}
        onChange={handleChange}
        required
        className="text-sm"
      />
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      {state?.success && <p className="text-sm text-primary">Foto atualizada.</p>}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Enviando..." : "Salvar foto"}
      </Button>
    </form>
  );
}
