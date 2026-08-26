import { listPendingErasureRequests } from "@/lib/services/erasure.service";
import { Card } from "@/components/ui/Card";
import { ProcessErasureButton } from "@/components/participantes/process-erasure-button";

export default async function SolicitacoesExclusaoPage() {
  const requests = await listPendingErasureRequests();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Solicitações de exclusão (LGPD)</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Revise antes de confirmar — a anonimização não pode ser desfeita.
      </p>

      <div className="mt-6 flex flex-col gap-3">
        {requests.length === 0 && (
          <Card className="p-6">
            <p className="text-sm text-muted-foreground">Nenhuma solicitação pendente.</p>
          </Card>
        )}
        {requests.map((req) => (
          <Card key={req.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">{req.participant?.full_name}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Solicitado em {new Date(req.requested_at).toLocaleDateString("pt-BR")}
              </p>
              <p className="mt-1 text-sm text-foreground">{req.reason}</p>
            </div>
            <ProcessErasureButton requestId={req.id} />
          </Card>
        ))}
      </div>
    </div>
  );
}
