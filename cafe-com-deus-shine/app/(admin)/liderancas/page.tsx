import Link from "next/link";
import { Plus } from "lucide-react";
import { listLeaders } from "@/lib/services/leaders.service";
import { LeadersList } from "@/components/liderancas/leaders-list";
import { PageHeader } from "@/components/ui/PageHeader";

export default async function LiderancasPage() {
  const leaders = await listLeaders();

  return (
    <div>
      <PageHeader title="Líderes">
        <Link
          href="/liderancas/nova"
          className="flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
        >
          <Plus size={16} />
          Nova líder
        </Link>
      </PageHeader>
      <div className="mt-4">
        <LeadersList leaders={leaders} />
      </div>
    </div>
  );
}
