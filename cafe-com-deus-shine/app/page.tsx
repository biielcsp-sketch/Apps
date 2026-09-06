import { redirect } from "next/navigation";
import { getCurrentProfile, isAdminRole } from "@/lib/services/profiles.service";
import { isLeaderRole, isHostRole } from "@/lib/role-labels";

export default async function RootPage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }
  if (isAdminRole(profile.role)) {
    redirect("/dashboard");
  }
  // Líder, co-líder e anfitriã caem no painel do café; participante vai
  // direto para a jornada dela.
  if (isLeaderRole(profile.role) || isHostRole(profile.role)) {
    redirect("/inicio");
  }
  redirect("/minha-jornada");
}
