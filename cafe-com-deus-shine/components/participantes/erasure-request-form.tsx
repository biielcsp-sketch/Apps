"use client";

import { useActionState } from "react";
import { requestErasureAction, type FormActionState } from "@/app/actions/participants";
import { Button } from "@/components/ui/Button";

export function ErasureRequestForm({
  participantId,
  isLeaderRoute,
}: {
  participantId: string;
  isLeaderRoute: boolean;
}) {
  const boundAction = requestErasureAction.bind(null, participantId, isLeaderRoute);
  const [state, action, pending] = useActionState<FormActionState, FormData>(boundAction, undefined);

  if (state?.success) {
    return (
      <p className="rounded-lg bg-muted p-3 text-sm text-foreground">
        Solicitação registrada. Uma administradora vai revisar antes de processar.
      </p>
    );
  }

  return (
    <details className="rounded-2xl border border-border bg-card p-5">
      <summary className="cursor-pointer text-sm font-semibold text-danger">
        Solicitar exclusão de dados (LGPD)
      </summary>
      <form action={action} className="mt-3 flex flex-col gap-3">
        <p className="text-xs text-muted-foreground">
          Isso cria uma solicitação pendente — os dados só são anonimizados depois que uma
          administradora revisar e confirmar.
        </p>
        <textarea
          name="reason"
          required
          rows={3}
          placeholder="Motivo da solicitação"
          className="w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
        />
        {state?.error && <p className="text-sm text-danger">{state.error}</p>}
        <Button type="submit" variant="danger" disabled={pending} className="self-start">
          {pending ? "Enviando..." : "Enviar solicitação"}
        </Button>
      </form>
    </details>
  );
}
