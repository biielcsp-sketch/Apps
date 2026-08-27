"use client";

import { useActionState } from "react";
import { createParticipantAccountAction } from "@/app/actions/participants";
import { Button } from "@/components/ui/Button";
import type { FormActionState } from "@/app/actions/participants";

const inputClass =
  "w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary";

export function CreateAccountForm({ participantId, fullName }: { participantId: string; fullName: string }) {
  const boundAction = createParticipantAccountAction.bind(null, participantId, fullName);
  const [state, action, pending] = useActionState<FormActionState, FormData>(boundAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        Ela ainda não tem acesso ao sistema. Informe o e-mail para enviar o convite de acesso.
      </p>
      <input name="email" type="email" required placeholder="E-mail da participante" className={inputClass} />
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      {state?.success && <p className="text-sm text-primary">Convite enviado.</p>}
      <Button type="submit" disabled={pending} variant="secondary" className="self-start">
        {pending ? "Enviando..." : "Criar acesso"}
      </Button>
    </form>
  );
}
