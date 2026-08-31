import { notFound } from "next/navigation";
import Link from "next/link";
import { getEnrollmentSource } from "@/lib/services/enrollment-sources.service";
import { Card } from "@/components/ui/Card";
import { ToggleActiveButton } from "@/components/qrcodes/toggle-active-button";

export default async function QrCodeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const source = await getEnrollmentSource(id);
  if (!source) notFound();

  const qrUrl = `/api/qrcodes/${source.code}`;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/configuracoes/qrcodes" className="text-sm text-muted-foreground hover:text-foreground">
          ← Voltar
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">{source.label}</h1>
        <p className="mt-1 text-sm text-muted-foreground">/cadastro?origem={source.code}</p>
      </div>

      <Card className="flex flex-col items-center gap-4 p-8">
        <p className="text-sm font-medium text-foreground">Prévia de como vai aparecer impresso</p>
        {/* eslint-disable-next-line @next/next/no-img-element -- gerado dinamicamente pelo Route Handler, não vale a pena passar pelo otimizador do next/image */}
        <img
          src={qrUrl}
          alt={`QR Code para ${source.label}`}
          width={280}
          height={280}
          className="rounded-lg border border-border bg-white p-4"
        />
        <div className="flex flex-wrap items-center justify-center gap-2">
          <a
            href={qrUrl}
            download={`qrcode-${source.code}.png`}
            className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
          >
            Baixar PNG
          </a>
          <ToggleActiveButton id={source.id} active={source.active} />
        </div>
        <p className="text-center text-xs text-muted-foreground">
          {source.active
            ? "Ativo — quem escanear este QR consegue se inscrever."
            : "Inativo — quem escanear vê uma mensagem de link expirado, sem apagar inscrições já recebidas."}
        </p>
      </Card>
    </div>
  );
}
