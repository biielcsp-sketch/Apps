import "server-only";
import { createClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/services/audit.service";
import { dbError } from "@/lib/errors";

// Transferência de participante já distribuída: fecha o vínculo aberto
// (end_date = hoje) e abre um novo — nunca sobrescreve o registro antigo.
// Não toca em meetings/follow_ups anteriores (item 14 da especificação).
export async function transferParticipant(
  participantId: string,
  newLeaderId: string,
  newGroupId: string | null,
  reason: string | null,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const today = new Date().toISOString().slice(0, 10);

  const { error: closeError } = await supabase
    .from("participant_leader_history")
    .update({ end_date: today, reason })
    .eq("participant_id", participantId)
    .is("end_date", null);
  if (closeError) dbError(closeError, "transfer.closeHistory");

  const { error: openError } = await supabase.from("participant_leader_history").insert({
    participant_id: participantId,
    leader_id: newLeaderId,
    group_id: newGroupId,
    start_date: today,
    changed_by: user?.id ?? null,
  });
  if (openError) dbError(openError, "transfer.openHistory");

  const { error: updateError } = await supabase
    .from("participants")
    .update({ current_leader_id: newLeaderId, current_group_id: newGroupId })
    .eq("id", participantId);
  if (updateError) dbError(updateError, "transfer.update");

  await logAuditEvent({
    action: "participant.transfer",
    entity: "participants",
    entityId: participantId,
    after: { new_leader_id: newLeaderId, new_group_id: newGroupId, reason },
  });
}
