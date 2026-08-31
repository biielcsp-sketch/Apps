import "server-only";
import { createClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/services/audit.service";
import { AppError, dbError } from "@/lib/errors";
import type { Tables, TablesInsert, TablesUpdate } from "@/types/database.types";

export type GroupRow = Tables<"groups">;

export async function listGroups() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("groups")
    .select("*, leader:leaders(id, profile:profiles(full_name)), occupants:participants!participants_current_group_id_fkey(count)")
    .order("name");

  if (error) dbError(error, "groups.list");

  return (data ?? []).map((g) => ({
    ...g,
    leader_name: g.leader?.profile?.full_name ?? "—",
    occupied: g.occupants?.[0]?.count ?? 0,
  }));
}

export async function getGroup(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("groups")
    .select("*, leader:leaders(id, profile:profiles(full_name))")
    .eq("id", id)
    .single();
  if (error) return null;
  return data;
}

export async function createGroup(input: TablesInsert<"groups">) {
  const supabase = await createClient();
  if (input.capacity <= 0) throw new AppError("A capacidade precisa ser maior que zero.");

  const { data, error } = await supabase.from("groups").insert(input).select().single();
  if (error) dbError(error, "groups.create");

  await logAuditEvent({ action: "group.create", entity: "groups", entityId: data.id, after: input });
  return data;
}

export async function updateGroup(id: string, input: TablesUpdate<"groups">) {
  const supabase = await createClient();
  if (input.capacity !== undefined && input.capacity !== null && input.capacity <= 0) {
    throw new AppError("A capacidade precisa ser maior que zero.");
  }

  const { data, error } = await supabase.from("groups").update(input).eq("id", id).select().single();
  if (error) dbError(error, "groups.update");

  await logAuditEvent({ action: "group.update", entity: "groups", entityId: id, after: input });
  return data;
}
