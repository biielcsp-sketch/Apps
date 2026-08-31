"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { GroupsList } from "@/components/grupos/groups-list";
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

export function GruposPanel({
  groups,
  leaders,
}: {
  groups: GroupItem[];
  leaders: { id: string; full_name: string }[];
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [leaderId, setLeaderId] = useState("");
  const [region, setRegion] = useState("");

  const filtered = useMemo(() => {
    const termo = search.trim().toLowerCase();
    const termoRegion = region.trim().toLowerCase();
    return groups.filter((g) => {
      if (termo && !g.name.toLowerCase().includes(termo)) return false;
      if (status && g.status !== status) return false;
      if (leaderId && g.leader_id !== leaderId) return false;
      if (termoRegion && !(g.region ?? "").toLowerCase().includes(termoRegion)) return false;
      return true;
    });
  }, [groups, search, status, leaderId, region]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{filtered.length} encontrados</p>
        <Link
          href="/grupos/novo"
          className="flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
        >
          <Plus size={16} />
          Novo grupo
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-2 md:grid-cols-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome"
          className={inputClass}
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
          <option value="">Todos os status</option>
          {(Object.entries(STATUS_LABELS) as [Enums<"group_status">, string][]).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select value={leaderId} onChange={(e) => setLeaderId(e.target.value)} className={inputClass}>
          <option value="">Todas as líderes</option>
          {leaders.map((l) => (
            <option key={l.id} value={l.id}>
              {l.full_name}
            </option>
          ))}
        </select>
        <input
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          placeholder="Cidade ou bairro"
          className={inputClass}
        />
      </div>

      <GroupsList groups={filtered} />
    </div>
  );
}
