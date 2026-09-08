import { redirect } from "next/navigation";
import { getCurrentProfile, isAdminRole } from "@/lib/services/profiles.service";
import { getMyAvatarSignedUrl } from "@/lib/services/avatar.service";
import { listCafeMedia, listGroupsICanPostTo } from "@/lib/services/cafe-media.service";
import { RoleShell } from "@/components/role-shell";
import { MediaUpload } from "@/components/mural/media-upload";
import { MediaCard } from "@/components/mural/media-card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";

// Mural: fotos e vídeos dos cafés. Todas veem; publicam a líder, a
// co-líder e a admin. Os arquivos ficam no Google Drive — aqui só passa
// o que descreve a publicação.
export default async function MuralPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const [avatarUrl, media, postableGroups] = await Promise.all([
    getMyAvatarSignedUrl(),
    listCafeMedia().catch(() => []),
    listGroupsICanPostTo().catch(() => []),
  ]);

  const isAdmin = isAdminRole(profile.role);
  const postableIds = new Set(postableGroups.map((g) => g.id));

  return (
    <RoleShell profile={profile} avatarUrl={avatarUrl}>
      <div className="flex flex-col gap-5">
        <PageHeader
          title="Mural de fotos"
          description="As fotos e os vídeos dos encontros, num lugar só."
        />

        {postableGroups.length > 0 && <MediaUpload postableGroups={postableGroups} />}

        {media.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-sm text-muted-foreground">
              O mural ainda está vazio. Assim que alguém publicar uma foto ou um vídeo, ele
              aparece aqui.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {media.map((item) => (
              <MediaCard
                key={item.id}
                media={item}
                // O botão só aparece para quem a RLS vai deixar apagar de
                // fato — o servidor confere de novo de qualquer forma.
                canDelete={
                  isAdmin || item.authorId === profile.id || postableIds.has(item.groupId)
                }
                currentProfileId={profile.id}
              />
            ))}
          </div>
        )}
      </div>
    </RoleShell>
  );
}
