import { Card } from "@/components/ui/Card";
import { LeaderCreateForm } from "@/components/liderancas/leader-create-form";

export default function NovaLiderancaPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Nova líder</h1>
      <Card className="mt-4 p-6">
        <LeaderCreateForm />
      </Card>
    </div>
  );
}
