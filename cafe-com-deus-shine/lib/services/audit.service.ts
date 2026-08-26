import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database.types";

export async function logAuditEvent(params: {
  action: string;
  entity: string;
  entityId: string;
  before?: Json | null;
  after?: Json | null;
}) {
  const supabase = await createClient();
  await supabase.rpc("app_log_audit_event", {
    p_action: params.action,
    p_entity: params.entity,
    p_entity_id: params.entityId,
    p_before: params.before ?? null,
    p_after: params.after ?? null,
  });
}
