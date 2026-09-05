import { redirect } from "next/navigation";
import { getCurrentProfile, isAdminRole } from "@/lib/services/profiles.service";
import { isLeaderRole } from "@/lib/role-labels";
import { getMyAvatarSignedUrl } from "@/lib/services/avatar.service";
import { ParticipanteShell } from "@/components/participante-shell";

export default async function ParticipanteLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();

  if (!profile) redirect("/login");
  if (isAdminRole(profile.role)) redirect("/dashboard");
  // Anfitriã fica: ela também é participante e tem jornada própria.
  if (isLeaderRole(profile.role)) redirect("/inicio");

  const avatarUrl = await getMyAvatarSignedUrl();

  return (
    <ParticipanteShell userName={profile.full_name} avatarUrl={avatarUrl}>
      {children}
    </ParticipanteShell>
  );
}
