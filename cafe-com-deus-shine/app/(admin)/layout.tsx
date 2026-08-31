import { redirect } from "next/navigation";
import { getCurrentProfile, isAdminRole } from "@/lib/services/profiles.service";
import { getMyAvatarSignedUrl } from "@/lib/services/avatar.service";
import { AdminShell } from "@/components/admin-shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();

  if (!profile) redirect("/login");
  if (profile.role === "participante") redirect("/minha-jornada");
  if (!isAdminRole(profile.role)) redirect("/inicio");

  const avatarUrl = await getMyAvatarSignedUrl();

  return (
    <AdminShell userName={profile.full_name} isDeveloper={profile.role === "desenvolvedor"} avatarUrl={avatarUrl}>
      {children}
    </AdminShell>
  );
}
