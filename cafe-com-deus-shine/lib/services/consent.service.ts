import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function getActiveTerms() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("app_terms_versions")
    .select("*")
    .order("published_at", { ascending: false })
    .limit(1)
    .single();

  if (error) throw new Error("Não foi possível carregar o termo de consentimento vigente.");
  return data;
}
