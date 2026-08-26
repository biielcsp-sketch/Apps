import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/services/profiles.service";
import { LiderShell } from "@/components/lider-shell";

export default async function LiderLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();

  if (!profile) redirect("/login");
  if (profile.role === "admin") redirect("/dashboard");

  return <LiderShell userName={profile.full_name}>{children}</LiderShell>;
}
