import { redirect } from "next/navigation";
import { getCurrentProfile, isAdminRole } from "@/lib/services/profiles.service";
import { listGroups } from "@/lib/services/groups.service";
import { getMyAvatarSignedUrl } from "@/lib/services/avatar.service";
import { AdminShell } from "@/components/admin-shell";
import { LiderShell } from "@/components/lider-shell";
import { GroupsLocationView } from "@/components/grupos/groups-location-view";
import { PageHeader } from "@/components/ui/PageHeader";
import { BackLink } from "@/components/ui/BackLink";

// Rota fora dos route groups por papel — igual /meu-perfil, admin,
// desenvolvedor e líder acessam a mesma tela (a RLS de `groups` já
// escopa: líder só vê o(s) próprio(s) café(s); admin/desenvolvedor veem
// todos), então o Shell certo é escolhido aqui manualmente.
export default async function GruposLocalizacaoPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role === "participante") redirect("/minha-jornada");

  const [groups, avatarUrl] = await Promise.all([listGroups(), getMyAvatarSignedUrl()]);

  const content = (
    <div className="flex flex-col gap-6">
      <BackLink href={isAdminRole(profile.role) ? "/dashboard" : "/inicio"} label={isAdminRole(profile.role) ? "Dashboard" : "Início"} />
      <PageHeader
        title="Localização dos Cafés"
        description="Insira e consulte onde cada café acontece."
      />
      <GroupsLocationView groups={groups} />
    </div>
  );

  if (isAdminRole(profile.role)) {
    return (
      <AdminShell
        userName={profile.full_name}
        isDeveloper={profile.role === "desenvolvedor"}
        avatarUrl={avatarUrl}
      >
        {content}
      </AdminShell>
    );
  }

  return (
    <LiderShell userName={profile.full_name} avatarUrl={avatarUrl}>
      {content}
    </LiderShell>
  );
}
