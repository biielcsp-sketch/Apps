"use client";

import { useActionState } from "react";
import { updateCafeRulesAction, type CafeRulesActionState } from "@/app/actions/cafe-rules";
import { Button } from "@/components/ui/Button";

export function CafeRulesForm({ initialText }: { initialText: string }) {
  const [state, formAction, pending] = useActionState<CafeRulesActionState, FormData>(
    updateCafeRulesAction,
    undefined,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground" htmlFor="text">
          Regras do café
        </label>
        <textarea
          id="text"
          name="text"
          rows={10}
          defaultValue={initialText}
          placeholder={"Ex.: Os encontros acontecem toda semana, no mesmo dia e horário.\nTraga sua Bíblia e um caderno.\nO que é compartilhado no grupo fica no grupo."}
          className="w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
        />
        <p className="text-xs text-muted-foreground">
          Este texto aparece para a participante no formulário de inscrição e na tela dela.
          Cada linha vira um parágrafo.
        </p>
      </div>

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      {state?.success && <p className="text-sm text-primary">Regras salvas.</p>}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Salvando..." : "Salvar regras"}
      </Button>
    </form>
  );
}
