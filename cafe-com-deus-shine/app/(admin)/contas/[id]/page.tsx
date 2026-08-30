import { notFound, redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/services/profiles.service";
import { getAccount } from "@/lib/services/accounts.service";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { ResetPasswordForm } from "@/components/accounts/reset-password-form";
import { UpdateEmailForm } from "@/components/accounts/update-email-form";

const ROLE_LABELS = {
  admin: "Admin",
  lider: "Líder",
  participante: "Participante",
  desenvolvedor: "Desenvolvedor",
};

export default async function ContaDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await getCurrentProfile();
  if (profile?.role !== "desenvolvedor") redirect("/dashboard");

  const { id } = await params;
  let account;
  try {
    account = await getAccount(id);
  } catch {
    notFound();
  }
  if (!account) notFound();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={account.full_name}
        description={`${account.email ?? "sem e-mail"} · ${ROLE_LABELS[account.role]}`}
      />

      <Card className="max-w-md p-6">
        <p className="mb-3 text-sm font-semibold text-foreground">Redefinir senha</p>
        <ResetPasswordForm profileId={account.id} />
      </Card>

      <Card className="max-w-md p-6">
        <p className="mb-3 text-sm font-semibold text-foreground">Alterar e-mail</p>
        <UpdateEmailForm profileId={account.id} currentEmail={account.email} />
      </Card>
    </div>
  );
}
