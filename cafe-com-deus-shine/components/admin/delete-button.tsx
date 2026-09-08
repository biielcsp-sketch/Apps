"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

// Botão "Excluir" das fichas de líder e de participante. O texto da
// confirmação vem de fora porque as duas exclusões têm consequências
// diferentes — e a pastora precisa ler qual é a dela antes de confirmar,
// não depois.
export function DeleteButton({
  confirmacao,
  onDelete,
  redirectTo,
  compact = false,
}: {
  confirmacao: string;
  onDelete: () => Promise<unknown>;
  redirectTo?: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  function handleClick() {
    if (!window.confirm(confirmacao)) return;
    setErro(null);
    startTransition(async () => {
      try {
        await onDelete();
        if (redirectTo) router.push(redirectTo);
        else router.refresh();
      } catch (e) {
        // A mensagem do servidor explica o que está travando (participantes
        // vinculadas, histórico de encontros). Fica na tela, e não só num
        // alerta que some, para a pastora poder reler o que precisa fazer.
        setErro(e instanceof Error ? e.message : "Não foi possível excluir.");
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-danger px-3.5 text-sm font-medium text-danger transition-colors hover:bg-danger hover:text-danger-foreground disabled:cursor-not-allowed disabled:opacity-50 ${
          compact ? "py-1.5" : "py-2"
        }`}
      >
        <Trash2 size={15} />
        {isPending ? "Excluindo..." : "Excluir"}
      </button>
      {erro && <p className="max-w-xs text-right text-xs text-danger">{erro}</p>}
    </div>
  );
}
