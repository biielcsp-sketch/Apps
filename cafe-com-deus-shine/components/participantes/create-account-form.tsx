"use client";

import { useState } from "react";
import { useActionState } from "react";
import { Copy, Check } from "lucide-react";
import { createParticipantAccountAction } from "@/app/actions/participants";
import { Button } from "@/components/ui/Button";
import type { FormActionState } from "@/app/actions/participants";

const inputClass =
  "w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary";

export function CreateAccountForm({ participantId, fullName }: { participantId: string; fullName: string }) {
  const boundAction = createParticipantAccountAction.bind(null, participantId, fullName);
  const [state, action, pending] = useActionState<FormActionState, FormData>(boundAction, undefined);
  const [copied, setCopied] = useState(false);

  async function copyLink(link: string) {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard indisponível (ex.: contexto não seguro) — o link
      // continua visível no campo para copiar manualmente.
    }
  }

  if (state?.inviteLink) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-foreground">
          Convite criado. Envie este link para a participante — ao abrir, ela define sua própria senha
          usando o e-mail informado.
        </p>
        <div className="flex items-center gap-2">
          <input readOnly value={state.inviteLink} className={inputClass} onFocus={(e) => e.target.select()} />
          <button
            type="button"
            onClick={() => copyLink(state.inviteLink!)}
            aria-label="Copiar link"
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
          >
            {copied ? <Check size={16} className="text-primary" /> : <Copy size={16} />}
            {copied ? "Copiado" : "Copiar"}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">O link expira em 24 horas.</p>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        Ela ainda não tem acesso ao sistema. Informe o e-mail para gerar o link de convite.
      </p>
      <input name="email" type="email" required placeholder="E-mail da participante" className={inputClass} />
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <Button type="submit" disabled={pending} variant="secondary" className="self-start">
        {pending ? "Gerando..." : "Gerar link de convite"}
      </Button>
    </form>
  );
}
