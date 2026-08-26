import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/services/profiles.service";

export default async function RootPage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }
  if (profile.role === "admin") {
    redirect("/dashboard");
  }
  redirect("/inicio");
}
