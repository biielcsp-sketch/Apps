import { redirect } from "next/navigation";
import { getCurrentProfile, isAdminRole } from "@/lib/services/profiles.service";
import { ParticipanteShell } from "@/components/participante-shell";

export default async function ParticipanteLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();

  if (!profile) redirect("/login");
  if (isAdminRole(profile.role)) redirect("/dashboard");
  if (profile.role === "lider") redirect("/inicio");

  return <ParticipanteShell userName={profile.full_name}>{children}</ParticipanteShell>;
}
