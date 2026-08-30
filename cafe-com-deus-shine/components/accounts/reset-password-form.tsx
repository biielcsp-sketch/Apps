"use client";

import { useActionState } from "react";
import { resetUserPasswordAction } from "@/app/actions/accounts";
import type { FormActionState } from "@/app/actions/participants";
import { Button } from "@/components/ui/Button";

const inputClass =
  "rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary";

export function ResetPasswordForm({ profileId }: { profileId: string }) {
  const action = resetUserPasswordAction.bind(null, profileId);
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(
    action,
    undefined,
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <label htmlFor="password" className="text-sm font-medium text-foreground">
        Nova senha
      </label>
      <input
        id="password"
        name="password"
        type="password"
        required
        minLength={6}
        autoComplete="new-password"
        className={inputClass}
      />
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      {state?.success && <p className="text-sm text-primary">Senha redefinida com sucesso.</p>}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Salvando..." : "Redefinir senha"}
      </Button>
    </form>
  );
}
