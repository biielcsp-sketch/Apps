import { redirect } from "next/navigation";
import { getCurrentProfile, isAdminRole } from "@/lib/services/profiles.service";
import { getMyAvatarSignedUrl } from "@/lib/services/avatar.service";
import { listStudyMaterials } from "@/lib/services/study-materials.service";
import { RoleShell, homePathFor } from "@/components/role-shell";
import { StudyMaterialsPanel } from "@/components/estudos/study-materials-panel";
import { PageHeader } from "@/components/ui/PageHeader";
import { BackLink } from "@/components/ui/BackLink";

// Estudo do mês: tela de publicação, exclusiva da pastora e do
// desenvolvedor. A comunidade não entra aqui — ela vê o tema do mês no
// Feed, que lê o mesmo material em modo leitura.
export default async function EstudosPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (!isAdminRole(profile.role)) redirect("/feed");

  const [avatarUrl, materials] = await Promise.all([
    getMyAvatarSignedUrl(),
    listStudyMaterials(),
  ]);
  const home = homePathFor(profile.role);

  return (
    <RoleShell profile={profile} avatarUrl={avatarUrl}>
      <div className="flex flex-col gap-6">
        <BackLink href={home.href} label={home.label} />
        <PageHeader
          title="Estudo do mês"
          description="Materiais com o tema do mês para os encontros."
        />
        <StudyMaterialsPanel materials={materials} canManage={isAdminRole(profile.role)} />
      </div>
    </RoleShell>
  );
}
