"use client";

import { useActionState } from "react";
import { createParticipantAction, type FormActionState } from "@/app/actions/participants";
import { PersonalFields, inputClass, labelClass } from "@/components/participantes/participant-fields";
import { Button } from "@/components/ui/Button";

export function ParticipantCreateForm() {
  const [state, action, pending] = useActionState<FormActionState, FormData>(
    createParticipantAction,
    undefined,
  );

  return (
    <form action={action} className="flex flex-col gap-6">
      <PersonalFields />

      <div className="flex flex-col gap-1.5">
        <label className={labelClass} htmlFor="enrollment_source">
          Origem da inscrição
        </label>
        <input id="enrollment_source" name="enrollment_source" className={inputClass} />
      </div>

      <div className="rounded-xl border border-border bg-muted p-4">
        <label className="flex items-start gap-2 text-sm text-foreground">
          <input type="checkbox" name="consent_accepted" className="mt-0.5" required />
          Ela concorda em receber contato e informações para participar dos encontros.
        </label>
      </div>

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Salvando..." : "Cadastrar participante"}
      </Button>
    </form>
  );
}
