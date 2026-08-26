"use client";

import { useTransition } from "react";
import { toggleLeaderStatusAction } from "@/app/actions/leaders";
import { Button } from "@/components/ui/Button";

export function ToggleStatusButton({ id, status }: { id: string; status: "ativa" | "inativa" }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant={status === "ativa" ? "danger" : "secondary"}
      disabled={isPending}
      onClick={() => startTransition(() => toggleLeaderStatusAction(id, status))}
    >
      {isPending ? "Salvando..." : status === "ativa" ? "Inativar líder" : "Reativar líder"}
    </Button>
  );
}
