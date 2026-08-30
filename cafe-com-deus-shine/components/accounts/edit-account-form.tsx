"use client";

import { useActionState } from "react";
import { updateAccountAction } from "@/app/actions/accounts";
import type { FormActionState } from "@/app/actions/participants";
import { Button } from "@/components/ui/Button";
import type { Tables } from "@/types/database.types";

const inputClass =
  "rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary";

const SYSTEM_ROLES: Array<Tables<"profiles">["role"]> = ["admin", "desenvolvedor"];

export function EditAccountForm({
  profileId,
  fullName,
  role,
}: {
  profileId: string;
  fullName: string;
  role: Tables<"profiles">["role"];
}) {
  const action = updateAccountAction.bind(null, profileId);
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(
    action,
    undefined,
  );

  const canChangeRole = SYSTEM_ROLES.includes(role);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="fullName" className="text-sm font-medium text-foreground">
          Nome completo
        </label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          required
          defaultValue={fullName}
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="role" className="text-sm font-medium text-foreground">
          Papel
        </label>
        {canChangeRole ? (
          <select id="role" name="role" required defaultValue={role} className={inputClass}>
            <option value="admin">Admin</option>
            <option value="desenvolvedor">Desenvolvedor</option>
          </select>
        ) : (
          <>
            <input type="hidden" name="role" value={role} />
            <p className="rounded-lg border border-border bg-muted px-3.5 py-2.5 text-sm text-muted-foreground">
              {role === "lider" ? "Líder" : "Participante"} — troque o papel pelas telas de Líderes/Participantes,
              não por aqui (essas contas têm dados vinculados que esta tela não gerencia).
            </p>
          </>
        )}
      </div>
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      {state?.success && <p className="text-sm text-primary">Conta atualizada com sucesso.</p>}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}
