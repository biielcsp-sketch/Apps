"use client";

import { useActionState, useState } from "react";
import { updateAccountAction } from "@/app/actions/accounts";
import type { FormActionState } from "@/app/actions/participants";
import { Button } from "@/components/ui/Button";
import type { Tables } from "@/types/database.types";

const inputClass =
  "rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary";

type Role = Tables<"profiles">["role"];
type UnclaimedParticipant = { id: string; full_name: string; city: string | null };

export function EditAccountForm({
  profileId,
  fullName,
  role,
  hasLeaderRow,
  hasParticipantRow,
  unclaimedParticipants,
}: {
  profileId: string;
  fullName: string;
  role: Role;
  hasLeaderRow: boolean;
  hasParticipantRow: boolean;
  unclaimedParticipants: UnclaimedParticipant[];
}) {
  const action = updateAccountAction.bind(null, profileId);
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(
    action,
    undefined,
  );
  const [selectedRole, setSelectedRole] = useState<Role>(role);

  const needsNewLeaderData = selectedRole === "lider" && selectedRole !== role && !hasLeaderRow;
  const needsParticipantLink =
    selectedRole === "participante" && selectedRole !== role && !hasParticipantRow;

  return (
    <form action={formAction} className="flex flex-col gap-4">
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
        <select
          id="role"
          name="role"
          required
          className={inputClass}
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value as Role)}
        >
          <option value="admin">Admin</option>
          <option value="desenvolvedor">Desenvolvedor</option>
          <option value="lider">Líder</option>
          <option value="participante">Participante</option>
        </select>
      </div>

      {needsParticipantLink && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="participantId" className="text-sm font-medium text-foreground">
            Participante a vincular
          </label>
          <select id="participantId" name="participantId" required className={inputClass} defaultValue="">
            <option value="" disabled>
              Selecione uma participante já cadastrada...
            </option>
            {unclaimedParticipants.map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name}
                {p.city ? ` — ${p.city}` : ""}
              </option>
            ))}
          </select>
          {unclaimedParticipants.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Nenhuma participante sem acesso no momento.
            </p>
          )}
        </div>
      )}

      {needsNewLeaderData && (
        <>
          <p className="text-xs text-muted-foreground">
            Esta conta ainda não tem cadastro de líder — informe os dados abaixo para criar um.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="city" className="text-sm font-medium text-foreground">
                Cidade
              </label>
              <input id="city" name="city" type="text" className={inputClass} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="neighborhood" className="text-sm font-medium text-foreground">
                Bairro
              </label>
              <input id="neighborhood" name="neighborhood" type="text" className={inputClass} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="meetingAddress" className="text-sm font-medium text-foreground">
              Endereço dos encontros
            </label>
            <input id="meetingAddress" name="meetingAddress" type="text" className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="region" className="text-sm font-medium text-foreground">
                Região
              </label>
              <input id="region" name="region" type="text" className={inputClass} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="maxCapacity" className="text-sm font-medium text-foreground">
                Capacidade máxima
              </label>
              <input
                id="maxCapacity"
                name="maxCapacity"
                type="number"
                min={1}
                required
                className={inputClass}
              />
            </div>
          </div>
        </>
      )}

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      {state?.success && <p className="text-sm text-primary">Conta atualizada com sucesso.</p>}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}
