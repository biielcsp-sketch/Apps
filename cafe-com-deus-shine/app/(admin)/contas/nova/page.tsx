import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/services/profiles.service";
import { listUnclaimedParticipants } from "@/lib/services/accounts.service";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { CreateDirectAccountForm } from "@/components/accounts/create-direct-account-form";

export default async function CriarContaDiretaPage() {
  const profile = await getCurrentProfile();
  if (profile?.role !== "desenvolvedor") redirect("/dashboard");

  const unclaimedParticipants = await listUnclaimedParticipants();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Criar conta direta"
        description="Exclusivo do perfil Desenvolvedor: cria uma conta já com senha definida, sem convite por e-mail nem autocadastro."
      />
      <Card className="max-w-md p-6">
        <CreateDirectAccountForm unclaimedParticipants={unclaimedParticipants} />
      </Card>
    </div>
  );
}
