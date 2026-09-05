import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/services/profiles.service";
import { getMyAvatarSignedUrl } from "@/lib/services/avatar.service";
import { RoleShell, homePathFor } from "@/components/role-shell";
import { ProfileView } from "@/components/perfil/profile-view";
import { BackLink } from "@/components/ui/BackLink";

// Rota fora de todos os route groups de papel — /meu-perfil é o mesmo
// caminho para admin, líder e participante, então não pode viver dentro
// de (admin)/(lider)/(participante) (os três resolveriam pro mesmo path
// e o Next recusa o build). O Shell certo é escolhido por RoleShell.
export default async function MeuPerfilPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const avatarUrl = await getMyAvatarSignedUrl();
  const home = homePathFor(profile.role);

  return (
    <RoleShell profile={profile} avatarUrl={avatarUrl}>
      <div className="flex flex-col gap-6">
        <BackLink href={home.href} label={home.label} />
        <ProfileView profile={profile} />
      </div>
    </RoleShell>
  );
}
