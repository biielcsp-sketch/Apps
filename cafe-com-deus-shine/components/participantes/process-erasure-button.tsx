"use client";

import { useTransition } from "react";
import { processErasureAction } from "@/app/actions/participants";
import { Button } from "@/components/ui/Button";

export function ProcessErasureButton({ requestId }: { requestId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="danger"
      disabled={isPending}
      onClick={() => {
        if (!confirm("Confirmar anonimização dos dados desta participante? Essa ação não pode ser desfeita.")) {
          return;
        }
        startTransition(() => processErasureAction(requestId));
      }}
    >
      {isPending ? "Processando..." : "Confirmar e anonimizar"}
    </Button>
  );
}
