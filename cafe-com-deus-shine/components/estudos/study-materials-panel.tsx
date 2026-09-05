"use client";

import { useActionState, useState, useTransition } from "react";
import { FileText, Image as ImageIcon, Sheet, Download, Trash2 } from "lucide-react";
import {
  uploadStudyMaterialAction,
  deleteStudyMaterialAction,
  getStudyMaterialUrlAction,
  type StudyMaterialActionState,
} from "@/app/actions/study-materials";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { StudyMaterial } from "@/lib/services/study-materials.service";

const inputClass =
  "w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary";
const labelClass = "text-sm font-medium text-foreground";

// Devolve o ícone já renderizado, não o componente: guardar o componente
// numa variável local faz o React remontá-lo a cada render.
function MaterialIcon({ mime }: { mime: string }) {
  if (mime.startsWith("image/")) return <ImageIcon size={18} />;
  if (mime.includes("sheet") || mime.includes("excel")) return <Sheet size={18} />;
  return <FileText size={18} />;
}

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function monthLabel(referenceMonth: string) {
  const date = new Date(`${referenceMonth.slice(0, 7)}-01T00:00:00`);
  return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

export function StudyMaterialsPanel({
  materials,
  canManage,
}: {
  materials: StudyMaterial[];
  canManage: boolean;
}) {
  const [state, formAction, pending] = useActionState<StudyMaterialActionState, FormData>(
    uploadStudyMaterialAction,
    undefined,
  );

  const grouped = materials.reduce<Record<string, StudyMaterial[]>>((acc, item) => {
    const key = item.reference_month.slice(0, 7);
    (acc[key] ??= []).push(item);
    return acc;
  }, {});
  const months = Object.keys(grouped).sort().reverse();

  const currentMonth = new Date().toISOString().slice(0, 7);

  return (
    <div className="flex flex-col gap-6">
      {canManage && (
        <Card className="p-6">
          <p className="mb-4 text-sm font-semibold text-foreground">Enviar material</p>
          <form action={formAction} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className={labelClass} htmlFor="title">Título</label>
              <input id="title" name="title" required placeholder="Tema do mês" className={inputClass} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} htmlFor="reference_month">Mês de referência</label>
              <input
                id="reference_month"
                name="reference_month"
                type="month"
                required
                defaultValue={currentMonth}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} htmlFor="file">Arquivo</label>
              <input
                id="file"
                name="file"
                type="file"
                required
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp"
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className={labelClass} htmlFor="description">Descrição (opcional)</label>
              <textarea id="description" name="description" rows={2} className={inputClass} />
            </div>
            {state?.error && <p className="text-sm text-danger sm:col-span-2">{state.error}</p>}
            {state?.success && <p className="text-sm text-primary sm:col-span-2">Material enviado.</p>}
            <Button type="submit" disabled={pending} className="self-start">
              {pending ? "Enviando..." : "Enviar material"}
            </Button>
          </form>
          <p className="mt-3 text-xs text-muted-foreground">
            Aceita PDF, Word, Excel e imagem, até 15MB por arquivo.
          </p>
        </Card>
      )}

      {months.length === 0 ? (
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">
            Nenhum material publicado ainda.
          </p>
        </Card>
      ) : (
        months.map((month) => (
          <div key={month}>
            <p className="mb-2 text-sm font-semibold capitalize text-foreground">
              {monthLabel(month)}
            </p>
            <div className="flex flex-col gap-2">
              {grouped[month].map((material) => (
                <MaterialRow key={material.id} material={material} canManage={canManage} />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function MaterialRow({ material, canManage }: { material: StudyMaterial; canManage: boolean }) {
  const [busy, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // O bucket é privado: o link de download é assinado na hora do clique e
  // vale poucos minutos, em vez de ficar exposto no HTML da listagem.
  async function open() {
    setError(null);
    const url = await getStudyMaterialUrlAction(material.storage_path);
    if (!url) {
      setError("Não foi possível abrir o arquivo agora.");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <MaterialIcon mime={material.mime_type} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{material.title}</p>
          <p className="truncate text-xs text-muted-foreground">
            {material.file_name} · {formatSize(material.size_bytes)}
          </p>
          {material.description && (
            <p className="mt-1 text-xs text-muted-foreground">{material.description}</p>
          )}
          {error && <p className="mt-1 text-xs text-danger">{error}</p>}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={open}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
        >
          <Download size={15} />
          Abrir
        </button>
        {canManage && (
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              if (!confirm(`Remover "${material.title}"?`)) return;
              startTransition(async () => {
                await deleteStudyMaterialAction(material.id);
              });
            }}
            className="rounded-lg border border-border p-2 text-danger hover:bg-muted disabled:opacity-50"
            aria-label="Remover material"
          >
            <Trash2 size={15} />
          </button>
        )}
      </div>
    </div>
  );
}
