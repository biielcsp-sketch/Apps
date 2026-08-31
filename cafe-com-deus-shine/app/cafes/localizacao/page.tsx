import { redirect } from "next/navigation";
import { getCurrentProfile, isAdminRole } from "@/lib/services/profiles.service";
import { listGroups } from "@/lib/services/groups.service";
import { AdminShell } from "@/components/admin-shell";
import { LiderShell } from "@/components/lider-shell";
import { GroupsLocationView } from "@/components/grupos/groups-location-view";
import { PageHeader } from "@/components/ui/PageHeader";

// Rota fora dos route groups por papel — igual /meu-perfil, admin,
// desenvolvedor e líder acessam a mesma tela (a RLS de `groups` já
// escopa: líder só vê o(s) próprio(s) café(s); admin/desenvolvedor veem
// todos), então o Shell certo é escolhido aqui manualmente.
export default async function GruposLocalizacaoPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role === "participante") redirect("/minha-jornada");

  const groups = await listGroups();

  const content = (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Localização dos Cafés"
        description="Insira e consulte onde cada café acontece."
      />
      <GroupsLocationView groups={groups} />
    </div>
  );

  if (isAdminRole(profile.role)) {
    return (
      <AdminShell userName={profile.full_name} isDeveloper={profile.role === "desenvolvedor"}>
        {content}
      </AdminShell>
    );
  }

  return <LiderShell userName={profile.full_name}>{content}</LiderShell>;
}
