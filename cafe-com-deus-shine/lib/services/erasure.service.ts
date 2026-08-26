import "server-only";
import { createClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/services/audit.service";

export async function requestErasure(participantId: string, reason: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Não encadeia .select() após o insert: pela matriz de RLS, uma líder só
  // tem INSERT em data_erasure_requests, não SELECT — e RETURNING exige a
  // policy de SELECT. Geramos o id no cliente para poder auditar mesmo sem
  // conseguir ler a linha de volta.
  const id = crypto.randomUUID();
  const { error } = await supabase.from("data_erasure_requests").insert({
    id,
    participant_id: participantId,
    requested_by: user?.id ?? null,
    reason,
    status: "pendente",
  });

  if (error) throw new Error(error.message);

  await logAuditEvent({
    action: "erasure.request",
    entity: "data_erasure_requests",
    entityId: id,
    after: { participant_id: participantId },
  });

  return { id };
}

export async function listPendingErasureRequests() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("data_erasure_requests")
    .select("*, participant:participants(id, full_name)")
    .eq("status", "pendente")
    .order("requested_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

// Executa a anonimização de fato (seção 5 da arquitetura). Não é exclusão
// física de linha — nomes/contatos/geo viram nulo, observações de
// follow_ups viram texto padrão, anonymized_at é setado.
export async function processErasure(requestId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: request, error: requestError } = await supabase
    .from("data_erasure_requests")
    .select("id, participant_id, status")
    .eq("id", requestId)
    .single();
  if (requestError || !request) throw new Error("Solicitação de exclusão não encontrada.");
  if (request.status !== "pendente") throw new Error("Esta solicitação já foi processada.");

  const anonymizedAt = new Date().toISOString();

  const { error: participantError } = await supabase
    .from("participants")
    .update({
      full_name: "Participante removida (LGPD)",
      preferred_name: null,
      phone: null,
      whatsapp: null,
      email: null,
      birth_date: null,
      address: null,
      geo_lat: null,
      geo_lng: null,
      admin_notes: null,
      anonymized_at: anonymizedAt,
    })
    .eq("id", request.participant_id);
  if (participantError) throw new Error(participantError.message);

  const { error: followupsError } = await supabase
    .from("follow_ups")
    .update({ observation: "[removido a pedido do titular]" })
    .eq("participant_id", request.participant_id);
  if (followupsError) throw new Error(followupsError.message);

  const { error: updateRequestError } = await supabase
    .from("data_erasure_requests")
    .update({ status: "concluida", processed_at: anonymizedAt, processed_by: user?.id ?? null })
    .eq("id", requestId);
  if (updateRequestError) throw new Error(updateRequestError.message);

  // Apenas metadados no audit_log — nunca o conteúdo original apagado.
  await logAuditEvent({
    action: "participant.anonymize",
    entity: "participants",
    entityId: request.participant_id,
    after: {
      fields_cleared: [
        "full_name",
        "preferred_name",
        "phone",
        "whatsapp",
        "email",
        "birth_date",
        "address",
        "geo_lat",
        "geo_lng",
        "admin_notes",
      ],
      follow_ups_observations_cleared: true,
      erasure_request_id: requestId,
    },
  });
}
