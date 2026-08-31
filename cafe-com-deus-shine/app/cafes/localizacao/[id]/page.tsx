import { notFound, redirect } from "next/navigation";
import { getCurrentProfile, isAdminRole } from "@/lib/services/profiles.service";
import { getGroup } from "@/lib/services/groups.service";
import { getMyAvatarSignedUrl } from "@/lib/services/avatar.service";
import { AdminShell } from "@/components/admin-shell";
import { LiderShell } from "@/components/lider-shell";
import { GroupLocationEditor } from "@/components/grupos/group-location-editor-loader";
import { PageHeader } from "@/components/ui/PageHeader";
import { BackLink } from "@/components/ui/BackLink";

export default async function GrupoLocalizacaoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role === "participante") redirect("/minha-jornada");

  const { id } = await params;
  // A RLS de `groups` já restringe uma líder ao(s) próprio(s) café(s) —
  // tentar abrir a localização de um café de outra líder cai aqui como
  // "não encontrado", não como erro de permissão.
  const [group, avatarUrl] = await Promise.all([getGroup(id), getMyAvatarSignedUrl()]);
  if (!group) notFound();

  const content = (
    <div className="flex flex-col gap-6">
      <BackLink href="/cafes/localizacao" label="Localização" />
      <PageHeader title={group.name} description="Defina onde este café se encontra." />
      <GroupLocationEditor
        groupId={group.id}
        initialLatitude={group.latitude}
        initialLongitude={group.longitude}
      />
    </div>
  );

  if (isAdminRole(profile.role)) {
    return (
      <AdminShell
        userName={profile.full_name}
        isDeveloper={profile.role === "desenvolvedor"}
        avatarUrl={avatarUrl}
      >
        {content}
      </AdminShell>
    );
  }

  return (
    <LiderShell userName={profile.full_name} avatarUrl={avatarUrl}>
      {content}
    </LiderShell>
  );
}
