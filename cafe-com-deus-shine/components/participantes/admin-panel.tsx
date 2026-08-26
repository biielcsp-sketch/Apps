"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  updateParticipantAdminAction,
  changeParticipantStatusAction,
  type FormActionState,
} from "@/app/actions/participants";
import { transferParticipantAction } from "@/app/actions/distribution";
import { Button } from "@/components/ui/Button";
import type { ParticipantRow } from "@/lib/services/participants.service";
import type { Enums } from "@/types/database.types";

const inputClass =
  "w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary";
const labelClass = "text-sm font-medium text-foreground";

const STATUS_OPTIONS: { value: Enums<"participant_status">; label: string }[] = [
  { value: "nova_inscricao", label: "Nova inscrição" },
  { value: "aguardando_distribuicao", label: "Aguardando distribuição" },
  { value: "distribuida", label: "Distribuída" },
  { value: "ativa", label: "Ativa" },
  { value: "acompanhamento", label: "Acompanhamento" },
  { value: "inativa", label: "Inativa" },
];

export function AdminPanel({
  participant,
  leaders,
}: {
  participant: ParticipantRow;
  leaders: { id: string; full_name: string }[];
}) {
  const adminAction = updateParticipantAdminAction.bind(null, participant.id);
  const [adminState, adminFormAction, adminPending] = useActionState<FormActionState, FormData>(
    adminAction,
    undefined,
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="mb-3 text-sm font-semibold text-foreground">Status da jornada</p>
        <form action={changeParticipantStatusAction.bind(null, participant.id)} className="flex flex-col gap-3">
          <select name="status" defaultValue={participant.status} className={inputClass}>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <input name="note" placeholder="Observação (opcional)" className={inputClass} />
          <Button type="submit" variant="secondary" className="self-start">
            Atualizar status
          </Button>
        </form>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="mb-3 text-sm font-semibold text-foreground">Líder responsável</p>
        {participant.current_leader_id ? (
          <form action={transferParticipantAction.bind(null, participant.id)} className="flex flex-col gap-3">
            <select name="leader_id" defaultValue="" required className={inputClass}>
              <option value="">Transferir para...</option>
              {leaders
                .filter((l) => l.id !== participant.current_leader_id)
                .map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.full_name}
                  </option>
                ))}
            </select>
            <input name="reason" placeholder="Motivo da transferência (opcional)" className={inputClass} />
            <input type="hidden" name="group_id" value="" />
            <Button type="submit" variant="secondary" className="self-start">
              Transferir (mantém histórico)
            </Button>
          </form>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">
              Esta participante ainda não tem líder atribuída.
            </p>
            <Link
              href={`/participantes/aguardando-distribuicao/${participant.id}`}
              className="self-start rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Distribuir agora
            </Link>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="mb-3 text-sm font-semibold text-foreground">Campos administrativos</p>
        <form action={adminFormAction} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className={labelClass} htmlFor="enrollment_source">
              Origem da inscrição
            </label>
            <input
              id="enrollment_source"
              name="enrollment_source"
              defaultValue={participant.enrollment_source ?? ""}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass} htmlFor="admin_notes">
              Observações administrativas
            </label>
            <textarea
              id="admin_notes"
              name="admin_notes"
              rows={3}
              defaultValue={participant.admin_notes ?? ""}
              className={inputClass}
            />
          </div>
          {adminState?.error && <p className="text-sm text-danger">{adminState.error}</p>}
          {adminState?.success && <p className="text-sm text-primary">Salvo.</p>}
          <Button type="submit" disabled={adminPending} variant="secondary" className="self-start">
            Salvar
          </Button>
        </form>
      </div>
    </div>
  );
}
