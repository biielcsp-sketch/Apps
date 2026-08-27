import Link from "next/link";
import { listAwaitingDistribution } from "@/lib/services/distribution.service";
import { Card } from "@/components/ui/Card";

export default async function AguardandoDistribuicaoPage() {
  const participants = await listAwaitingDistribution();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Aguardando distribuição</h1>
      <p className="mt-1 text-sm text-muted-foreground">{participants.length} participantes</p>

      <div className="mt-4 flex flex-col gap-2">
        {participants.length === 0 && (
          <Card className="p-6">
            <p className="text-sm text-muted-foreground">Nenhuma participante aguardando distribuição.</p>
          </Card>
        )}
        {participants.map((p) => (
          <Link
            key={p.id}
            href={`/participantes/aguardando-distribuicao/${p.id}`}
            className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 hover:bg-muted"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{p.full_name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {[p.city, p.neighborhood].filter(Boolean).join(" / ") || "Localização não informada"}
              </p>
            </div>
            <span className="shrink-0 text-right text-xs text-muted-foreground">
              Inscrita em {new Date(p.enrollment_date).toLocaleDateString("pt-BR")}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
