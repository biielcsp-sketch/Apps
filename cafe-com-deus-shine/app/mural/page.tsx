import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile, isAdminRole } from "@/lib/services/profiles.service";
import { getMyAvatarSignedUrl } from "@/lib/services/avatar.service";
import { listCafeMedia, listGroupsICanPostTo } from "@/lib/services/cafe-media.service";
import { driveConfigStatus, isDriveConfigured } from "@/lib/google-drive";
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

  // Quem, pelo papel, deveria ter o formulário de publicar na tela. Serve
  // para distinguir "não pode publicar" de "pode, mas falta alguma coisa"
  // — antes as duas situações davam a mesma tela em branco.
  const deveriaPublicar =
    isAdmin || profile.role === "lider" || profile.role === "co_lider";

  const driveFaltando = driveConfigStatus()
    .filter((v) => !v.presente)
    .map((v) => v.nome);

  return (
    <RoleShell profile={profile} avatarUrl={avatarUrl}>
      <div className="flex flex-col gap-5">
        <PageHeader
          title="Mural de fotos"
          description="As fotos e os vídeos dos encontros, num lugar só."
        />

        {/* O aviso de configuração vem antes do formulário: sem as
            credenciais do Drive, publicar falha no último passo, e é
            melhor dizer isso de cara do que depois do upload. */}
        {deveriaPublicar && !isDriveConfigured() && (
          <Card className="flex flex-col gap-2 p-5">
            <p className="text-sm font-semibold text-foreground">
              O envio para o Google Drive ainda não está ligado
            </p>
            {isAdmin ? (
              <>
                <p className="text-sm text-muted-foreground">
                  O sistema guarda as fotos e os vídeos no Google Drive, e para isso precisa
                  das credenciais da conta. Estas o servidor não está enxergando:
                </p>
                {/* Só o nome e o fato de faltar — o valor nunca chega à tela. */}
                <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
                  {driveFaltando.map((nome) => (
                    <li key={nome} className="ml-5 list-disc">
                      <code className="font-mono text-xs">{nome}</code>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                O sistema guarda as fotos e os vídeos no Google Drive, e as credenciais dessa
                conta ainda não foram configuradas. Avise quem cuida do sistema — é ajuste da
                hospedagem, não dá para resolver por aqui.
              </p>
            )}
            {isAdmin && (
              <p className="text-sm text-muted-foreground">
                No Netlify, em <strong>Site configuration → Environment variables</strong>:
                confira o nome exato, deixe o escopo em <strong>All scopes</strong> e o
                contexto em <strong>All deploy contexts</strong>, e publique um novo deploy
                depois de salvar — variável criada depois do último deploy só passa a valer
                no seguinte.
              </p>
            )}
          </Card>
        )}

        {postableGroups.length > 0 ? (
          <MediaUpload postableGroups={postableGroups} />
        ) : (
          deveriaPublicar && (
            <Card className="flex flex-col gap-2 p-5">
              <p className="text-sm font-semibold text-foreground">
                Ainda não dá para publicar
              </p>
              {isAdmin ? (
                <p className="text-sm text-muted-foreground">
                  Toda publicação do mural pertence a um café, e ainda não há nenhum
                  cadastrado. Cadastre o primeiro em{" "}
                  <Link href="/cafes" className="font-medium text-primary hover:underline">
                    Cafés
                  </Link>{" "}
                  e o formulário aparece aqui.
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Toda publicação do mural pertence a um café, e você ainda não está
                  vinculada a nenhum. Assim que a administração te vincular, o formulário
                  aparece aqui.
                </p>
              )}
            </Card>
          )
        )}

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
