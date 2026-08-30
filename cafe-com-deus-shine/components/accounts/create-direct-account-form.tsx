"use client";

import { useActionState } from "react";
import { createDirectAccountAction } from "@/app/actions/accounts";
import type { FormActionState } from "@/app/actions/participants";
import { Button } from "@/components/ui/Button";

const inputClass =
  "rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary";

export function CreateDirectAccountForm() {
  const [state, action, pending] = useActionState<FormActionState, FormData>(
    createDirectAccountAction,
    undefined,
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="fullName" className="text-sm font-medium text-foreground">
          Nome completo
        </label>
        <input id="fullName" name="fullName" type="text" required className={inputClass} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium text-foreground">
          E-mail
        </label>
        <input id="email" name="email" type="email" required autoComplete="email" className={inputClass} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium text-foreground">
          Senha
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
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="role" className="text-sm font-medium text-foreground">
          Papel
        </label>
        <select id="role" name="role" required className={inputClass} defaultValue="admin">
          <option value="admin">Admin</option>
          <option value="desenvolvedor">Desenvolvedor</option>
        </select>
      </div>
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      {state?.success && (
        <p className="text-sm text-primary">Conta criada com sucesso. A senha já pode ser usada para login.</p>
      )}
      <Button type="submit" disabled={pending} className="mt-2 w-full">
        {pending ? "Criando..." : "Criar conta"}
      </Button>
    </form>
  );
}
