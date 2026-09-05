"use client";

import { useActionState, useTransition } from "react";
import Image from "next/image";
import { Trash2 } from "lucide-react";
import {
  uploadCafePhotoAction,
  deleteCafePhotoAction,
  type CafePhotoActionState,
} from "@/app/actions/cafe-photos";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { CafePhoto } from "@/lib/services/cafe-photos.service";

const inputClass =
  "w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary";

export function PhotoWall({
  photos,
  postableGroups,
}: {
  photos: CafePhoto[];
  // Vazio para quem só visualiza (participante e anfitriã) — nesse caso o
  // formulário de envio nem aparece.
  postableGroups: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState<CafePhotoActionState, FormData>(
    uploadCafePhotoAction,
    undefined,
  );
  const canPost = postableGroups.length > 0;

  return (
    <Card className="p-5">
      <p className="mb-3 text-sm font-semibold text-foreground">Mural de fotos do café</p>

      {canPost && (
        <form action={formAction} className="mb-4 flex flex-col gap-3 border-b border-border pb-4">
          {postableGroups.length === 1 ? (
            <input type="hidden" name="group_id" value={postableGroups[0].id} />
          ) : (
            <select name="group_id" required defaultValue="" className={inputClass} aria-label="Café">
              <option value="">Selecione o café...</option>
              {postableGroups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          )}
          <input
            type="file"
            name="file"
            required
            accept="image/jpeg,image/png,image/webp"
            className={inputClass}
            aria-label="Foto"
          />
          <input name="caption" placeholder="Legenda (opcional)" className={inputClass} />
          {state?.error && <p className="text-sm text-danger">{state.error}</p>}
          <Button type="submit" disabled={pending} className="self-start">
            {pending ? "Enviando..." : "Publicar foto"}
          </Button>
        </form>
      )}

      {photos.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhuma foto ainda. As fotos dos encontros aparecem aqui.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((photo) => (
            <PhotoTile key={photo.id} photo={photo} canManage={canPost} />
          ))}
        </div>
      )}
    </Card>
  );
}

function PhotoTile({ photo, canManage }: { photo: CafePhoto; canManage: boolean }) {
  const [busy, startTransition] = useTransition();

  return (
    <figure className="overflow-hidden rounded-xl border border-border">
      {photo.url ? (
        <Image
          src={photo.url}
          alt={photo.caption ?? `Foto de ${photo.group_name ?? "um café"}`}
          width={400}
          height={400}
          unoptimized
          className="h-32 w-full object-cover"
        />
      ) : (
        <div className="flex h-32 items-center justify-center bg-muted">
          <span className="text-xs text-muted-foreground">Indisponível</span>
        </div>
      )}
      <figcaption className="p-2">
        {photo.caption && <p className="truncate text-xs text-foreground">{photo.caption}</p>}
        <p className="truncate text-[11px] text-muted-foreground">{photo.group_name ?? "—"}</p>
        {canManage && (
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              if (!confirm("Remover esta foto do mural?")) return;
              startTransition(async () => {
                await deleteCafePhotoAction(photo.id);
              });
            }}
            className="mt-1 flex items-center gap-1 text-[11px] font-medium text-danger disabled:opacity-50"
          >
            <Trash2 size={12} />
            Remover
          </button>
        )}
      </figcaption>
    </figure>
  );
}
