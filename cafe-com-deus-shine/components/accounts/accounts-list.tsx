import Link from "next/link";
import type { Tables } from "@/types/database.types";

const ROLE_LABELS: Record<Tables<"profiles">["role"], string> = {
  admin: "Admin",
  lider: "Líder",
  participante: "Participante",
  desenvolvedor: "Desenvolvedor",
};

type AccountRow = Pick<Tables<"profiles">, "id" | "full_name" | "email" | "role" | "active">;

export function AccountsList({ accounts }: { accounts: AccountRow[] }) {
  if (accounts.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhuma conta encontrada.</p>;
  }

  return (
    <div className="flex flex-col divide-y divide-border rounded-2xl border border-border bg-card">
      {accounts.map((account) => (
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
  );
}
