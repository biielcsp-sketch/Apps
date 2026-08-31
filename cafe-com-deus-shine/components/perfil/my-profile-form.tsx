"use client";

import { useActionState } from "react";
import { updateMyProfileAction, type FormActionState } from "@/app/actions/profile";
import { Button } from "@/components/ui/Button";
import type { CurrentProfile } from "@/lib/services/profiles.service";

const inputClass =
  "w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary";
const labelClass = "text-sm font-medium text-foreground";

export function MyProfileForm({ profile }: { profile: CurrentProfile }) {
  const [state, action, pending] = useActionState<FormActionState, FormData>(
    updateMyProfileAction,
    undefined,
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="full_name" className={labelClass}>
          Nome completo
        </label>
        <input
          id="full_name"
          name="full_name"
          defaultValue={profile.full_name}
          required
          className={inputClass}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="phone" className={labelClass}>
            Telefone
          </label>
          <input id="phone" name="phone" defaultValue={profile.phone ?? ""} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="whatsapp" className={labelClass}>
            WhatsApp
          </label>
          <input id="whatsapp" name="whatsapp" defaultValue={profile.whatsapp ?? ""} className={inputClass} />
        </div>
      </div>

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      {state?.success && <p className="text-sm text-primary">Dados atualizados.</p>}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Salvando..." : "Salvar alterações"}
      </Button>
    </form>
  );
}
