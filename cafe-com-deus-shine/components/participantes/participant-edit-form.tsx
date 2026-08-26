"use client";

import { useActionState } from "react";
import { updateParticipantPersonalAction, type FormActionState } from "@/app/actions/participants";
import { PersonalFields } from "@/components/participantes/participant-fields";
import { Button } from "@/components/ui/Button";
import type { ParticipantRow } from "@/lib/services/participants.service";

export function ParticipantEditForm({
  participant,
  isLeaderRoute,
}: {
  participant: ParticipantRow;
  isLeaderRoute: boolean;
}) {
  const boundAction = updateParticipantPersonalAction.bind(null, participant.id, isLeaderRoute);
  const [state, action, pending] = useActionState<FormActionState, FormData>(boundAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-6">
      <PersonalFields defaults={participant} />
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Salvando..." : "Salvar alterações"}
      </Button>
    </form>
  );
}
