import Link from "next/link";
import { Plus } from "lucide-react";
import { listLeaders } from "@/lib/services/leaders.service";
import { LeadersList } from "@/components/liderancas/leaders-list";

export default async function LiderancasPage() {
  const leaders = await listLeaders();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Líderes</h1>
        <Link
          href="/liderancas/nova"
          className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
        >
          <Plus size={16} />
          Nova líder
        </Link>
      </div>
      <div className="mt-4">
        <LeadersList leaders={leaders} />
      </div>
    </div>
  );
}
