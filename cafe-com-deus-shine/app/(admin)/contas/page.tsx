import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { getCurrentProfile } from "@/lib/services/profiles.service";
import { listAllAccounts } from "@/lib/services/accounts.service";
import { PageHeader } from "@/components/ui/PageHeader";
import { AccountsGrouped } from "@/components/accounts/accounts-grouped";

export default async function ContasPage() {
  const profile = await getCurrentProfile();
  if (profile?.role !== "desenvolvedor") redirect("/dashboard");

  const accounts = await listAllAccounts();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Contas"
        description="Exclusivo do perfil Desenvolvedor: veja todas as contas, redefina senha ou altere o e-mail de qualquer uma."
      >
        <Link
          href="/contas/nova"
          className="flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
        >
          <Plus size={16} />
          Criar conta direta
        </Link>
      </PageHeader>
      <AccountsGrouped accounts={accounts} />
    </div>
  );
}
