import { redirect } from "next/navigation";
import { getCurrentProfile, isAdminRole } from "@/lib/services/profiles.service";

export default async function RootPage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }
  if (isAdminRole(profile.role)) {
    redirect("/dashboard");
  }
  redirect("/inicio");
}
