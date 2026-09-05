import { getCafeRules } from "@/lib/services/cafe-rules.service";
import { CafeRulesForm } from "@/components/configuracoes/cafe-rules-form";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { BackLink } from "@/components/ui/BackLink";

export default async function RegrasDoCafePage() {
  const rules = await getCafeRules();

  return (
    <div className="flex flex-col gap-6">
      <BackLink href="/dashboard" label="Dashboard" />
      <PageHeader
        title="Regras do café"
        description="O combinado que toda participante lê ao se inscrever."
      />
      <Card className="max-w-2xl p-6">
        <CafeRulesForm initialText={rules} />
      </Card>
    </div>
  );
}
