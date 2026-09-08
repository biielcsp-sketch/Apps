import Link from "next/link";
import { Pencil } from "lucide-react";
import { PARTICIPANT_STATUS_BADGE, PARTICIPANT_STATUS_LABELS } from "@/lib/participant-status-labels";
import { AttentionBadge } from "@/components/acompanhamento/attention-badge";
import { ParticipantDeleteButton } from "@/components/participantes/participant-delete-button";
import type { ParticipantListItem } from "@/lib/services/participants.service";
import type { ParticipantAlerts } from "@/lib/services/followup.service";

export function ParticipantsTable({
  participants,
  basePath,
  alertsMap,
  // Liga os botões Editar/Excluir na própria lista, para a pastora não
  // precisar abrir a ficha só para corrigir um telefone. Fica desligado
  // por padrão: a mesma tabela aparece nas telas da líder.
  canManage = false,
}: {
  participants: ParticipantListItem[];
  basePath: string;
  alertsMap?: Map<string, ParticipantAlerts>;
  canManage?: boolean;
}) {
  if (participants.length === 0) {
    return (
      <p className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
        Nenhuma participante encontrada com esses filtros.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {participants.map((p) => (
        // Com os botões na linha, o cartão inteiro não pode mais ser um
        // link: um <button> dentro de um <a> não é HTML válido e o clique
        // vira loteria entre navegar e excluir.
        <div
          key={p.id}
          className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 hover:bg-muted"
        >
          <Link href={`${basePath}/${p.id}`} className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{p.full_name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {p.leader?.full_name ?? "Sem líder"} · {p.city ?? "Cidade não informada"}
            </p>
            <div className="mt-1">
              <AttentionBadge alerts={alertsMap?.get(p.id)} />
            </div>
          </Link>

          <div className="flex shrink-0 items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${PARTICIPANT_STATUS_BADGE[p.status]}`}
            >
              {PARTICIPANT_STATUS_LABELS[p.status]}
            </span>
            {canManage && (
              <>
                <Link
                  href={`${basePath}/${p.id}/editar`}
                  className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
                >
                  <Pencil size={14} />
                  Editar
                </Link>
                <ParticipantDeleteButton id={p.id} nome={p.full_name} compact />
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
