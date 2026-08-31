import { redirect } from "next/navigation";
import { getCurrentProfile, isAdminRole } from "@/lib/services/profiles.service";
import { AdminShell } from "@/components/admin-shell";
import { LiderShell } from "@/components/lider-shell";
import { ParticipanteShell } from "@/components/participante-shell";
import { ProfileView } from "@/components/perfil/profile-view";

// Rota fora de todos os route groups de papel — /meu-perfil é o mesmo
// caminho para admin, líder e participante, então não pode viver dentro
// de (admin)/(lider)/(participante) (os três resolveriam pro mesmo path
// e o Next recusa o build). Aqui escolhemos manualmente o Shell certo
// pelo papel da sessão atual, igual cada layout de grupo faz sozinho.
export default async function MeuPerfilPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  if (isAdminRole(profile.role)) {
    return (
      <AdminShell userName={profile.full_name} isDeveloper={profile.role === "desenvolvedor"}>
        <ProfileView profile={profile} />
      </AdminShell>
    );
  }

  if (profile.role === "lider") {
    return (
      <LiderShell userName={profile.full_name}>
        <ProfileView profile={profile} />
      </LiderShell>
    );
  }

  return (
    <ParticipanteShell userName={profile.full_name}>
      <ProfileView profile={profile} />
    </ParticipanteShell>
  );
}
