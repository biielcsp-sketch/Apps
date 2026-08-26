import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { getCurrentProfile } from "@/lib/services/profiles.service";
import { getLeaderDashboard } from "@/lib/services/dashboard.service";
import { createClient } from "@/lib/supabase/server";

export default async function InicioPage() {
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
        <h1 className="text-2xl font-semibold text-foreground">
          Olá, {profile?.full_name.split(" ")[0]} 🌷
        </h1>
        <Card className="mt-6 p-6">
          <p className="text-sm text-muted-foreground">
            Sua conta ainda não está vinculada a um registro de líder. Fale com a administradora.
          </p>
        </Card>
      </div>
    );
  }

  const data = await getLeaderDashboard(leader.id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Olá, {profile?.full_name.split(" ")[0]} 🌷
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {data.participantCount} mulher(es) sob seu acompanhamento
        </p>
      </div>

      {data.lastMeetingSummary && (
        <Card className="p-5">
          <p className="mb-3 text-sm font-semibold text-foreground">Último encontro</p>
          <div className="flex gap-6">
            <div>
              <p className="text-xl font-semibold text-primary">{data.lastMeetingSummary.presentes}</p>
              <p className="text-xs text-muted-foreground">presentes</p>
            </div>
            <div>
              <p className="text-xl font-semibold text-danger">{data.lastMeetingSummary.ausentes}</p>
              <p className="text-xs text-muted-foreground">ausentes</p>
            </div>
          </div>
        </Card>
      )}

      <Card className="p-5">
        <p className="mb-2 text-sm font-semibold text-foreground">Próximo encontro</p>
        {data.nextMeeting ? (
          <>
            <p className="text-sm text-foreground">
              {new Date(`${data.nextMeeting.date}T00:00:00`).toLocaleDateString("pt-BR")}
              {data.nextMeeting.time ? ` — ${data.nextMeeting.time.slice(0, 5)}` : ""}
              {data.nextMeeting.location ? ` — ${data.nextMeeting.location}` : ""}
            </p>
            <Link
              href={`/meus-encontros/${data.nextMeeting.id}`}
              className="mt-3 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Ver participantes
            </Link>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhum encontro agendado.</p>
        )}
      </Card>

      <Card className="p-5">
        <p className="text-sm font-semibold text-foreground">Acompanhamentos</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {data.needingAttention} mulher(es) precisam de atenção
        </p>
        <Link
          href="/minhas-participantes"
          className="mt-3 inline-block rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
        >
          Ver acompanhamentos
        </Link>
      </Card>
    </div>
  );
}
