import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/services/profiles.service";
import { getLeaderAssignmentHistory } from "@/lib/services/participants.service";
import { Card } from "@/components/ui/Card";
import { BackLink } from "@/components/ui/BackLink";

export default async function HistoricoPage() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();
  const { data: leader } = await supabase
    .from("leaders")
    .select("id")
    .eq("profile_id", profile?.id ?? "")
    .maybeSingle();

  if (!leader) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Histórico</h1>
        <Card className="mt-4 p-6">
          <p className="text-sm text-muted-foreground">
            Sua conta ainda não está vinculada a um registro de líder.
          </p>
        </Card>
      </div>
    );
  }

  const history = await getLeaderAssignmentHistory(leader.id);

  return (
    <div>
      <BackLink href="/inicio" label="Início" />
      <h1 className="mt-3 text-2xl font-semibold text-foreground">Histórico</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Participantes que estão ou já estiveram sob sua responsabilidade
      </p>
      <div className="mt-4 flex flex-col gap-2">
        {history.length === 0 && (
          <Card className="p-6">
            <p className="text-sm text-muted-foreground">Nenhum vínculo registrado ainda.</p>
          </Card>
        )}
        {history.map((h) => (
          <Link
            key={h.id}
            href={`/minhas-participantes/${h.participant?.id}`}
            className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 hover:bg-muted"
          >
            <p className="min-w-0 truncate text-sm font-medium text-foreground">{h.participant?.full_name}</p>
            <p className="shrink-0 text-xs text-muted-foreground">
              {new Date(h.start_date).toLocaleDateString("pt-BR")} —{" "}
              {h.end_date ? new Date(h.end_date).toLocaleDateString("pt-BR") : "atual"}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
