"use client";

import { useActionState } from "react";
import { createEnrollmentSourceAction, type FormActionState } from "@/app/actions/enrollment-sources";
import { Button } from "@/components/ui/Button";

const inputClass =
  "w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary";
const labelClass = "text-sm font-medium text-foreground";

export function CreateSourceForm() {
  const [state, action, pending] = useActionState<FormActionState, FormData>(
    createEnrollmentSourceAction,
    undefined,
  );

  return (
    <form
      action={action}
      className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-end"
    >
      <div className="flex flex-1 flex-col gap-1.5">
        <label className={labelClass} htmlFor="label">
          Nome da origem
        </label>
        <input
          id="label"
          name="label"
          required
          placeholder="Ex.: Café Alphaville - Outubro/2026"
          className={inputClass}
        />
      </div>
      <div className="flex flex-1 flex-col gap-1.5">
        <label className={labelClass} htmlFor="code">
          Código (opcional — gerado a partir do nome)
        </label>
        <input id="code" name="code" placeholder="cafe-alphaville-out-2026" className={inputClass} />
      </div>
      {state?.error && <p className="text-sm text-danger sm:self-center">{state.error}</p>}
      <Button type="submit" disabled={pending} className="shrink-0">
        {pending ? "Criando..." : "Criar QR Code"}
      </Button>
    </form>
  );
}
