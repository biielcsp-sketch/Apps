import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/services/profiles.service";
import { getMyAvatarSignedUrl } from "@/lib/services/avatar.service";
import {
  listBibleBooks,
  getBibleChapter,
  listMyBibleFavorites,
} from "@/lib/services/bible.service";
import { RoleShell, homePathFor } from "@/components/role-shell";
import { BibleReader } from "@/components/biblia/bible-reader";
import { PageHeader } from "@/components/ui/PageHeader";
import { BackLink } from "@/components/ui/BackLink";

// Bíblia Almeida (domínio público) servida do próprio app, um arquivo por
// livro — leitura funciona sem depender de serviço externo.
export default async function BibliaPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const [avatarUrl, books, chapter, favorites] = await Promise.all([
    getMyAvatarSignedUrl(),
    listBibleBooks(),
    getBibleChapter("jo", 1),
    listMyBibleFavorites(),
  ]);
  const home = homePathFor(profile.role);

  return (
    <RoleShell profile={profile} avatarUrl={avatarUrl}>
      <div className="flex flex-col gap-6">
        <BackLink href={home.href} label={home.label} />
        <PageHeader title="Bíblia" description="Leia, ouça, favorite e compartilhe." />
        <BibleReader books={books} initialChapter={chapter} favorites={favorites} />
      </div>
    </RoleShell>
  );
}
