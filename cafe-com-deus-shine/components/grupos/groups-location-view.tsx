"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import type { listGroups } from "@/lib/services/groups.service";
import type { Enums } from "@/types/database.types";

type GroupItem = Awaited<ReturnType<typeof listGroups>>[number];

const STATUS_LABELS: Record<Enums<"group_status">, string> = {
  ativo: "Ativo",
  inativo: "Inativo",
  lotado: "Lotado",
};

const inputClass =
  "w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary";

// Leaflet toca em `window`/`document` já na importação do módulo — não é
// seguro em SSR. Carregado só no cliente.
const GroupsMap = dynamic(() => import("@/components/grupos/groups-map").then((m) => m.GroupsMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center">
      <p className="text-sm text-muted-foreground">Carregando mapa...</p>
    </div>
  ),
});

export function GroupsLocationView({ groups }: { groups: GroupItem[] }) {
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("");
  const [status, setStatus] = useState("");

  const regions = useMemo(
    () => Array.from(new Set(groups.map((g) => g.region).filter((r): r is string => !!r))).sort(),
    [groups],
  );

  const withLocation = useMemo(
    () => groups.filter((g) => g.latitude != null && g.longitude != null),
    [groups],
  );

  const filtered = useMemo(() => {
    const termo = search.trim().toLowerCase();
    return groups.filter((g) => {
      if (termo && !g.name.toLowerCase().includes(termo)) return false;
      if (region && g.region !== region) return false;
      if (status && g.status !== status) return false;
      return true;
    });
  }, [groups, search, region, status]);

  const filteredWithLocation = useMemo(
    () => filtered.filter((g) => g.latitude != null && g.longitude != null),
    [filtered],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="p-5">
          <p className="text-2xl font-semibold text-foreground">{groups.length}</p>
          <p className="text-sm text-muted-foreground">Cafés no total</p>
        </Card>
        <Card className="p-5">
          <p className="text-2xl font-semibold text-foreground">{withLocation.length}</p>
          <p className="text-sm text-muted-foreground">Com localização no mapa</p>
        </Card>
      </div>

      <Card className="h-[420px] overflow-hidden p-0">
        <GroupsMap
          groups={filteredWithLocation.map((g) => ({
            id: g.id,
            name: g.name,
            latitude: g.latitude as number,
            longitude: g.longitude as number,
            region: g.region,
          }))}
        />
      </Card>

      <div className="grid grid-cols-1 gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome..."
          className={inputClass}
        />
        <select value={region} onChange={(e) => setRegion(e.target.value)} className={inputClass}>
          <option value="">Todas as regiões</option>
          {regions.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
          <option value="">Todos os status</option>
          {(Object.entries(STATUS_LABELS) as [Enums<"group_status">, string][]).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        {filtered.length === 0 ? (
          <Card className="p-6">
            <p className="text-sm text-muted-foreground">Nenhum café encontrado.</p>
          </Card>
        ) : (
          filtered.map((g) => (
            <Link
              key={g.id}
              href={`/cafes/localizacao/${g.id}`}
              className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 hover:bg-muted"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{g.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {g.region ?? "sem região"} · {g.occupied}/{g.capacity} vagas
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {(g.latitude == null || g.longitude == null) && (
                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                    Sem localização
                  </span>
                )}
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                  {STATUS_LABELS[g.status]}
                </span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
