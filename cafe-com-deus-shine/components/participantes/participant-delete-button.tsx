"use client";

import { deleteParticipantAction } from "@/app/actions/participants";
import { DeleteButton } from "@/components/admin/delete-button";

export function ParticipantDeleteButton({
  id,
  nome,
  redirectTo,
  compact,
}: {
  id: string;
  nome: string;
  redirectTo?: string;
  compact?: boolean;
}) {
  return (
    <DeleteButton
      compact={compact}
      redirectTo={redirectTo}
      confirmacao={
        `Excluir ${nome}?\n\n` +
        "Nome, telefone, e-mail, endereço e as observações de acompanhamento são " +
        "apagados definitivamente. A contagem de presença nos encontros continua, " +
        "sem ligação com ela — é o que a LGPD exige.\n\nEssa ação não pode ser desfeita."
      }
      onDelete={() => deleteParticipantAction(id)}
    />
  );
}
