"use client";

import { useActionState, useState } from "react";
import { createAccountAction } from "@/app/actions/accounts";
import type { FormActionState } from "@/app/actions/participants";
import { Button } from "@/components/ui/Button";

const inputClass =
  "rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary";

type Role = "admin" | "desenvolvedor" | "lider" | "participante";

type UnclaimedParticipant = { id: string; full_name: string; city: string | null };

export function CreateDirectAccountForm({
  unclaimedParticipants,
}: {
  unclaimedParticipants: UnclaimedParticipant[];
}) {
  const [state, action, pending] = useActionState<FormActionState, FormData>(
    createAccountAction,
    undefined,
  );
  const [role, setRole] = useState<Role>("admin");

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="role" className="text-sm font-medium text-foreground">
          Papel
        </label>
        <select
          id="role"
          name="role"
          required
          className={inputClass}
          value={role}
          onChange={(e) => setRole(e.target.value as Role)}
        >
          <option value="admin">Admin</option>
          <option value="desenvolvedor">Desenvolvedor</option>
          <option value="lider">Líder</option>
          <option value="participante">Participante</option>
        </select>
      </div>

      {role === "participante" ? (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="participantId" className="text-sm font-medium text-foreground">
            Participante
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
              Nenhuma participante sem acesso no momento. Cadastre uma em Participantes primeiro.
            </p>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="fullName" className="text-sm font-medium text-foreground">
            Nome completo
          </label>
          <input id="fullName" name="fullName" type="text" required className={inputClass} />
        </div>
      )}

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

      {role === "lider" && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="phone" className="text-sm font-medium text-foreground">
                Telefone
              </label>
              <input id="phone" name="phone" type="text" className={inputClass} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="whatsapp" className="text-sm font-medium text-foreground">
                WhatsApp
              </label>
              <input id="whatsapp" name="whatsapp" type="text" className={inputClass} />
            </div>
          </div>
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
      {state?.success && (
        <p className="text-sm text-primary">Conta criada com sucesso. A senha já pode ser usada para login.</p>
      )}
      <Button type="submit" disabled={pending} className="mt-2 w-full">
        {pending ? "Criando..." : "Criar conta"}
      </Button>
    </form>
  );
}
