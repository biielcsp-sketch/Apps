import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpen, CalendarDays, FileText } from "lucide-react";
import { getCurrentProfile } from "@/lib/services/profiles.service";
import { getMyAvatarSignedUrl } from "@/lib/services/avatar.service";
import { getDailyVerse } from "@/lib/services/bible.service";
import { listStudyMaterials } from "@/lib/services/study-materials.service";
import { listCafePhotos, listGroupsICanPostTo } from "@/lib/services/cafe-photos.service";
import { listMeetings } from "@/lib/services/meetings.service";
import { RoleShell } from "@/components/role-shell";
import { PhotoWall } from "@/components/feed/photo-wall";
import { StudyMaterialsPanel } from "@/components/estudos/study-materials-panel";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";

// Feed: a tela onde a comunidade acompanha o que está acontecendo —
// versículo do dia, próximos encontros, o tema do mês (só leitura; quem
// publica é a pastora, em /estudos) e o mural de fotos dos cafés.
export default async function FeedPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const [avatarUrl, verse, materials, photos, postableGroups, meetings] = await Promise.all([
    getMyAvatarSignedUrl(),
    getDailyVerse(),
    listStudyMaterials().catch(() => []),
    listCafePhotos().catch(() => []),
    listGroupsICanPostTo().catch(() => []),
    listMeetings({}).catch(() => []),
  ]);

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = meetings
    .filter((m) => m.date >= today && m.status !== "cancelado")
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 4);

  // Só o material do mês corrente aparece no Feed; o histórico completo
  // fica em /estudos, para quem tem acesso.
  const currentMonth = today.slice(0, 7);
  const monthMaterials = materials.filter((m) => m.reference_month.slice(0, 7) === currentMonth);

  return (
    <RoleShell profile={profile} avatarUrl={avatarUrl}>
      <div className="flex flex-col gap-6">
        <PageHeader
          title={`Olá, ${profile.full_name.split(" ")[0]} 🌷`}
          description="O que está acontecendo no Café com Deus Shine."
        />

        {verse && (
          <Card className="bg-logo-panel p-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-primary">
              Versículo do dia
            </p>
            <p className="text-base leading-relaxed text-foreground">{verse.text}</p>
            <p className="mt-3 text-sm font-medium text-primary">
              {verse.bookName} {verse.chapter}:{verse.verse}
            </p>
            <Link
              href="/biblia"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary"
            >
              <BookOpen size={15} />
              Abrir a Bíblia
            </Link>
          </Card>
        )}

        <Card className="p-5">
          <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <CalendarDays size={16} className="text-primary" />
            Próximos encontros
          </p>
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum encontro agendado no momento.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {upcoming.map((meeting) => (
                <div key={meeting.id} className="rounded-xl border border-border p-3">
                  <p className="text-sm font-medium text-foreground">{meeting.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(`${meeting.date}T00:00:00`).toLocaleDateString("pt-BR")}
                    {meeting.time ? ` — ${meeting.time.slice(0, 5)}` : ""}
                    {meeting.group?.name ? ` · ${meeting.group.name}` : ""}
                  </p>
                  {meeting.ministered_by && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Palavra: {meeting.ministered_by}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <FileText size={16} className="text-primary" />
            Tema do mês
          </p>
          {monthMaterials.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              O material deste mês ainda não foi publicado.
            </p>
          ) : (
            // canManage=false: no Feed o tema é só leitura — publicar é na
            // aba Estudo do mês, exclusiva da pastora.
            <StudyMaterialsPanel materials={monthMaterials} canManage={false} />
          )}
        </Card>

        <PhotoWall photos={photos} postableGroups={postableGroups} />
      </div>
    </RoleShell>
  );
}
