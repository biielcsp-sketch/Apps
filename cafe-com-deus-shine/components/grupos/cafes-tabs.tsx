"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { GruposPanel } from "@/components/grupos/grupos-panel";
import { EncontrosPanel } from "@/components/encontros/encontros-panel";
import { GroupsLocationView } from "@/components/grupos/groups-location-view";
import type { listGroups } from "@/lib/services/groups.service";
import type { listMeetings } from "@/lib/services/meetings.service";

type GroupItem = Awaited<ReturnType<typeof listGroups>>[number];
type MeetingItem = Awaited<ReturnType<typeof listMeetings>>[number];

const TABS = [
  { key: "grupos", label: "Grupos" },
  { key: "encontros", label: "Encontros" },
  { key: "localizacao", label: "Localização" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

export function CafesTabs({
  groups,
  meetings,
  leaders,
  groupsForSelect,
}: {
  groups: GroupItem[];
  meetings: MeetingItem[];
  leaders: { id: string; full_name: string }[];
  groupsForSelect: { id: string; name: string }[];
}) {
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const initialTab: TabKey = TABS.some((t) => t.key === requestedTab) ? (requestedTab as TabKey) : "grupos";
  const [tab, setTab] = useState<TabKey>(initialTab);

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

      {tab === "grupos" && <GruposPanel groups={groups} leaders={leaders} />}
      {tab === "encontros" && (
        <EncontrosPanel meetings={meetings} leaders={leaders} groups={groupsForSelect} />
      )}
      {tab === "localizacao" && <GroupsLocationView groups={groups} />}
    </div>
  );
}
