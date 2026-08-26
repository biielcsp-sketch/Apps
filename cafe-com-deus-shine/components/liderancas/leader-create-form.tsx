"use client";

import { useActionState } from "react";
import { createLeaderAction } from "@/app/actions/leaders";
import { Button } from "@/components/ui/Button";
import type { FormActionState } from "@/app/actions/participants";

const inputClass =
  "w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary";
const labelClass = "text-sm font-medium text-foreground";

export function LeaderCreateForm() {
  const [state, action, pending] = useActionState<FormActionState, FormData>(
    createLeaderAction,
    undefined,
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      <p className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
        Um convite por e-mail será enviado para a líder definir a própria senha.
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label className={labelClass} htmlFor="full_name">Nome completo</label>
          <input id="full_name" name="full_name" required className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label className={labelClass} htmlFor="email">E-mail</label>
          <input id="email" name="email" type="email" required className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor="phone">Telefone</label>
          <input id="phone" name="phone" className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor="whatsapp">WhatsApp</label>
          <input id="whatsapp" name="whatsapp" className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor="city">Cidade</label>
          <input id="city" name="city" className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor="neighborhood">Bairro</label>
          <input id="neighborhood" name="neighborhood" className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label className={labelClass} htmlFor="meeting_address">Endereço do encontro</label>
          <input id="meeting_address" name="meeting_address" className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor="region">Região de atuação</label>
          <input id="region" name="region" className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor="max_capacity">Capacidade máxima</label>
          <input
            id="max_capacity"
            name="max_capacity"
            type="number"
            min={1}
            defaultValue={12}
            required
            className={inputClass}
          />
        </div>
      </div>
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Enviando convite..." : "Cadastrar líder"}
      </Button>
    </form>
  );
}
