import { redirect } from "next/navigation";
import { getCurrentProfile, isAdminRole } from "@/lib/services/profiles.service";
import { LiderShell } from "@/components/lider-shell";

export default async function LiderLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();

  if (!profile) redirect("/login");
  if (isAdminRole(profile.role)) redirect("/dashboard");
  if (profile.role === "participante") redirect("/minha-jornada");

  return <LiderShell userName={profile.full_name}>{children}</LiderShell>;
}
