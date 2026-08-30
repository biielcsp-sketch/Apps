"use client";

import { useActionState } from "react";
import { updateUserEmailAction } from "@/app/actions/accounts";
import type { FormActionState } from "@/app/actions/participants";
import { Button } from "@/components/ui/Button";

const inputClass =
  "rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary";

export function UpdateEmailForm({ profileId, currentEmail }: { profileId: string; currentEmail: string | null }) {
  const action = updateUserEmailAction.bind(null, profileId);
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(
    action,
    undefined,
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <label htmlFor="email" className="text-sm font-medium text-foreground">
        Novo e-mail
      </label>
      <input
        id="email"
        name="email"
        type="email"
        required
        autoComplete="email"
        defaultValue={currentEmail ?? ""}
        className={inputClass}
      />
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      {state?.success && <p className="text-sm text-primary">E-mail atualizado com sucesso.</p>}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Salvando..." : "Alterar e-mail"}
      </Button>
    </form>
  );
}
