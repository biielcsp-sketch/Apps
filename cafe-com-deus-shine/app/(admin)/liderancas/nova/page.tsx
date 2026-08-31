import { Card } from "@/components/ui/Card";
import { LeaderCreateForm } from "@/components/liderancas/leader-create-form";
import { BackLink } from "@/components/ui/BackLink";

export default function NovaLiderancaPage() {
  return (
    <div>
      <BackLink href="/liderancas" label="Líderes" />
      <h1 className="mt-3 text-2xl font-semibold text-foreground">Nova líder</h1>
      <Card className="mt-4 p-6">
        <LeaderCreateForm />
      </Card>
    </div>
  );
}
