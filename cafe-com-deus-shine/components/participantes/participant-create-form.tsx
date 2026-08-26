"use client";

import { useActionState } from "react";
import { createParticipantAction, type FormActionState } from "@/app/actions/participants";
import { PersonalFields, inputClass, labelClass } from "@/components/participantes/participant-fields";
import { CONSENT_METHODS, CONSENT_METHOD_LABELS } from "@/lib/validators/participant.schema";
import { Button } from "@/components/ui/Button";

export function ParticipantCreateForm({ termsContent }: { termsContent: string }) {
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
        <p className="mb-2 text-sm font-semibold text-foreground">Termo de consentimento (LGPD)</p>
        <div className="max-h-40 overflow-y-auto whitespace-pre-wrap rounded-lg bg-card p-3 text-xs text-muted-foreground">
          {termsContent}
        </div>
        <div className="mt-3 flex flex-col gap-3">
          <label className="flex items-start gap-2 text-sm text-foreground">
            <input type="checkbox" name="consent_accepted" className="mt-0.5" required />
            A participante (ou responsável presente) leu e aceitou o termo acima.
          </label>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass} htmlFor="consent_method">
              Como o consentimento foi obtido
            </label>
            <select id="consent_method" name="consent_method" required className={inputClass}>
              <option value="">Selecione...</option>
              {CONSENT_METHODS.map((method) => (
                <option key={method} value={method}>
                  {CONSENT_METHOD_LABELS[method]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Salvando..." : "Cadastrar participante"}
      </Button>
    </form>
  );
}
