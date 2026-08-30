import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/services/profiles.service";
import { AdminShell } from "@/components/admin-shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();

  if (!profile) redirect("/login");
  if (profile.role === "participante") redirect("/minha-jornada");
  if (profile.role !== "admin" && profile.role !== "desenvolvedor") redirect("/inicio");

  return (
    <AdminShell userName={profile.full_name} isDeveloper={profile.role === "desenvolvedor"}>
      {children}
    </AdminShell>
  );
}
