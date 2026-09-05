import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database.types";

export async function logAuditEvent(params: {
  action: string;
  entity: string;
  // Opcional: nem toda entidade auditável tem um id uuid (app_config, por
  // exemplo, é chaveada por texto) — a coluna já aceita nulo.
  entityId?: string | null;
  before?: Json | null;
  after?: Json | null;
}) {
  const supabase = await createClient();
  await supabase.rpc("app_log_audit_event", {
    p_action: params.action,
    p_entity: params.entity,
    p_entity_id: params.entityId ?? null,
    p_before: params.before ?? null,
    p_after: params.after ?? null,
  });
}
