"use client";

import { useTransition } from "react";
import { toggleEnrollmentSourceActiveAction } from "@/app/actions/enrollment-sources";
import { Button } from "@/components/ui/Button";

export function ToggleActiveButton({ id, active }: { id: string; active: boolean }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant={active ? "secondary" : "primary"}
      disabled={pending}
      onClick={() => startTransition(() => toggleEnrollmentSourceActiveAction(id, active))}
    >
      {pending ? "..." : active ? "Desativar" : "Ativar"}
    </Button>
  );
}
