import Link from "next/link";
import { listEnrollmentSources } from "@/lib/services/enrollment-sources.service";
import { CreateSourceForm } from "@/components/qrcodes/create-source-form";
import { ToggleActiveButton } from "@/components/qrcodes/toggle-active-button";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";

export default async function QrCodesPage() {
  const sources = await listEnrollmentSources();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="QR Codes"
        description="Códigos de origem para o cadastro público em eventos — cada um vira um QR Code para imprimir."
      />

      <CreateSourceForm />

      <div className="flex flex-col gap-2">
        {sources.length === 0 && (
          <Card className="p-6">
            <p className="text-sm text-muted-foreground">Nenhum QR Code criado ainda.</p>
          </Card>
        )}
        {sources.map((s) => (
          <Card key={s.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{s.label}</p>
              <p className="truncate text-xs text-muted-foreground">/cadastro?origem={s.code}</p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  s.active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                }`}
              >
                {s.active ? "Ativo" : "Inativo"}
              </span>
              <Link
                href={`/configuracoes/qrcodes/${s.id}`}
                className="text-sm font-medium text-primary hover:underline"
              >
                Ver QR
              </Link>
              <ToggleActiveButton id={s.id} active={s.active} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
