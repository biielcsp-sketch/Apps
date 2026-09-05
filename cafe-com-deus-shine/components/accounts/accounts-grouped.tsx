"use client";

import { useState } from "react";
import Link from "next/link";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";
import type { Tables } from "@/types/database.types";
import { ROLE_LABELS, ROLE_ORDER } from "@/lib/role-labels";


type AccountRow = Pick<Tables<"profiles">, "id" | "full_name" | "email" | "role" | "active">;

const TABS = [
  { key: "papel", label: "Por Papel" },
  { key: "status", label: "Por Status" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

export function AccountsGrouped({ accounts }: { accounts: AccountRow[] }) {
  const [tab, setTab] = useState<TabKey>("papel");

  if (accounts.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhuma conta encontrada.</p>;
  }

  const groups =
    tab === "papel"
      ? ROLE_ORDER.map((role) => ({
          key: role,
          title: `${ROLE_LABELS[role]}s`,
          items: accounts.filter((a) => a.role === role),
        }))
      : [
          { key: "ativas", title: "Ativas", items: accounts.filter((a) => a.active) },
          { key: "inativas", title: "Inativas", items: accounts.filter((a) => !a.active) },
        ];

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

      <div className="flex flex-col gap-3">
        {groups.map((group) => (
          <AccountGroupSection key={group.key} title={group.title} items={group.items} />
        ))}
      </div>
    </div>
  );
}

function AccountGroupSection({ title, items }: { title: string; items: AccountRow[] }) {
  const [busca, setBusca] = useState("");

  const termo = busca.trim().toLowerCase();
  const filtradas = termo
    ? items.filter(
        (a) =>
          a.full_name.toLowerCase().includes(termo) || (a.email ?? "").toLowerCase().includes(termo),
      )
    : items;

  return (
    <CollapsibleSection
      title={title}
      count={items.length}
      search={items.length > 0 ? { value: busca, onChange: setBusca, placeholder: "Buscar por nome ou e-mail..." } : undefined}
    >
      {items.length === 0 ? (
        <p className="px-4 py-4 text-sm text-muted-foreground">Nenhuma conta nesta categoria.</p>
      ) : filtradas.length === 0 ? (
        <p className="px-4 py-4 text-sm text-muted-foreground">Nenhuma conta encontrada para essa busca.</p>
      ) : (
        <div className="flex flex-col divide-y divide-border">
          {filtradas.map((account) => (
            <Link
              key={account.id}
              href={`/contas/${account.id}`}
              className="flex flex-col gap-1 p-4 hover:bg-muted sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">{account.full_name}</p>
                <p className="truncate text-sm text-muted-foreground">{account.email ?? "sem e-mail"}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {!account.active && (
                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                    Inativa
                  </span>
                )}
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                  {ROLE_LABELS[account.role]}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </CollapsibleSection>
  );
}
