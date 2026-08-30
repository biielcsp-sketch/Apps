"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setAccountActiveAction, deleteAccountAction } from "@/app/actions/accounts";
import { Button } from "@/components/ui/Button";

export function AccountDangerZone({
  profileId,
  active,
  isOwnAccount,
}: {
  profileId: string;
  active: boolean;
  isOwnAccount: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleToggleActive() {
    setError(null);
    startTransition(async () => {
      try {
        await setAccountActiveAction(profileId, !active);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao salvar.");
      }
    });
  }

  function handleDelete() {
    if (!window.confirm("Excluir esta conta? Essa ação não pode ser desfeita.")) return;
    setError(null);
    startTransition(async () => {
      try {
        await deleteAccountAction(profileId);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao excluir.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex flex-wrap gap-2">
        {!isOwnAccount && (
          <Button variant="secondary" disabled={isPending} onClick={handleToggleActive}>
            {isPending ? "Salvando..." : active ? "Desativar conta" : "Reativar conta"}
          </Button>
        )}
        {!isOwnAccount && (
          <Button variant="danger" disabled={isPending} onClick={handleDelete}>
            {isPending ? "Excluindo..." : "Excluir conta"}
          </Button>
        )}
      </div>
      {isOwnAccount && (
        <p className="text-sm text-muted-foreground">
          Não é possível desativar ou excluir a própria conta por aqui.
        </p>
      )}
    </div>
  );
}
