"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { EnrollmentRegistration } from "@/lib/services/enrollment-sources.service";

const TABS = [
  { key: "qrcode", label: "QR Code" },
  { key: "registrations", label: "Quem se cadastrou" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

function isToday(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export function QrCodeTabs({
  code,
  registrations,
}: {
  code: string;
  registrations: EnrollmentRegistration[];
}) {
  const [tab, setTab] = useState<TabKey>("qrcode");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.key
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "qrcode" ? (
        <QrCodePanel code={code} />
      ) : (
        <RegistrationsPanel registrations={registrations} />
      )}
    </div>
  );
}

function QrCodePanel({ code }: { code: string }) {
  const qrUrl = `/api/qrcodes/${code}`;
  const formUrl = `/cadastro?origem=${code}`;

  return (
    <Card className="flex flex-col items-center gap-4 p-8 text-center">
      <p className="text-sm text-muted-foreground">
        Aponte a câmera do celular para o QR Code para preencher o cadastro.
      </p>
      {/* eslint-disable-next-line @next/next/no-img-element -- gerado dinamicamente pelo Route Handler, não vale a pena passar pelo otimizador do next/image */}
      <img
        src={qrUrl}
        alt="QR Code de cadastro"
        width={280}
        height={280}
        className="rounded-lg border border-border bg-white p-4"
      />
      <a
        href={formUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
      >
        Abrir Formulário
      </a>
    </Card>
  );
}

function RegistrationsPanel({ registrations }: { registrations: EnrollmentRegistration[] }) {
  const router = useRouter();
  const [busca, setBusca] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const termo = busca.trim().toLowerCase();
  const filtradas = termo
    ? registrations.filter((r) => r.full_name.toLowerCase().includes(termo))
    : registrations;
  const hojeCount = useMemo(() => registrations.filter((r) => isToday(r.created_at)).length, [registrations]);

  function atualizar() {
    setRefreshing(true);
    router.refresh();
    setTimeout(() => setRefreshing(false), 500);
  }

  return (
    <div className="flex flex-col gap-3">
      <input
        type="text"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar por nome..."
        className="w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
      />

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{hojeCount} cadastro(s) hoje</p>
        <Button type="button" variant="secondary" onClick={atualizar} disabled={refreshing}>
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          <span className="ml-1.5">Atualizar</span>
        </Button>
      </div>

      <Card className="p-4">
        {filtradas.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">Nada encontrado.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {filtradas.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{r.full_name}</p>
                  {r.phone && <p className="truncate text-xs text-muted-foreground">{r.phone}</p>}
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {new Date(r.created_at).toLocaleDateString("pt-BR")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
