"use client";

import { deleteLeaderAction } from "@/app/actions/leaders";
import { DeleteButton } from "@/components/admin/delete-button";

export function LeaderDeleteButton({
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
        `Excluir a líder ${nome}?\n\n` +
        "O cadastro e o acesso dela ao sistema são apagados. Só funciona se ela " +
        "não tiver participantes, cafés ou encontros no histórico — se tiver, o " +
        'caminho é "Inativar líder".\n\nEssa ação não pode ser desfeita.'
      }
      onDelete={() => deleteLeaderAction(id)}
    />
  );
}
