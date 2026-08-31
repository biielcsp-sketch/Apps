"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { MeetingsList } from "@/components/encontros/meetings-list";
import type { listMeetings } from "@/lib/services/meetings.service";
import type { Enums } from "@/types/database.types";

type MeetingItem = Awaited<ReturnType<typeof listMeetings>>[number];

const STATUS_LABELS: Record<Enums<"meeting_status">, string> = {
  planejado: "Planejado",
  confirmado: "Confirmado",
  realizado: "Realizado",
  cancelado: "Cancelado",
};

const inputClass =
  "w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary";

export function EncontrosPanel({
  meetings,
  leaders,
  groups,
}: {
  meetings: MeetingItem[];
  leaders: { id: string; full_name: string }[];
  groups: { id: string; name: string }[];
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [leaderId, setLeaderId] = useState("");
  const [groupId, setGroupId] = useState("");

  const filtered = useMemo(() => {
    const termo = search.trim().toLowerCase();
    return meetings.filter((m) => {
      if (termo && !m.title.toLowerCase().includes(termo)) return false;
      if (status && m.status !== status) return false;
      if (leaderId && m.leader_id !== leaderId) return false;
      if (groupId && m.group_id !== groupId) return false;
      return true;
    });
  }, [meetings, search, status, leaderId, groupId]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{filtered.length} encontrados</p>
        <Link
          href="/encontros/novo"
          className="flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
        >
          <Plus size={16} />
          Novo encontro
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-2 md:grid-cols-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por título"
          className={inputClass}
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
          <option value="">Todos os status</option>
          {(Object.entries(STATUS_LABELS) as [Enums<"meeting_status">, string][]).map(([value, label]) => (
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
        <select value={groupId} onChange={(e) => setGroupId(e.target.value)} className={inputClass}>
          <option value="">Todos os grupos</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </div>

      <MeetingsList meetings={filtered} basePath="/encontros" />
    </div>
  );
}
