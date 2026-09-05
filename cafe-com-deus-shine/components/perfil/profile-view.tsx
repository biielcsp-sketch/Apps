import { getMyAvatarSignedUrl } from "@/lib/services/avatar.service";
import { AvatarUpload } from "@/components/ui/avatar-upload";
import { MyProfileForm } from "@/components/perfil/my-profile-form";
import { ChangePasswordForm } from "@/components/perfil/change-password-form";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { logout } from "@/app/actions/auth";
import type { CurrentProfile } from "@/lib/services/profiles.service";
import { ROLE_LABELS } from "@/lib/role-labels";


export async function ProfileView({ profile }: { profile: CurrentProfile }) {
  const signedUrl = await getMyAvatarSignedUrl();
  const initials = profile.full_name.trim().charAt(0).toUpperCase();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Meu perfil" />

      <Card className="flex flex-col items-center gap-4 p-8">
        <AvatarUpload currentSignedUrl={signedUrl} initials={initials} />
        <div className="text-center">
          <p className="text-lg font-semibold text-foreground">{profile.full_name}</p>
          <p className="text-sm text-muted-foreground">{ROLE_LABELS[profile.role]}</p>
        </div>
      </Card>

      <Card className="max-w-md p-6">
        <p className="mb-3 text-sm font-semibold text-foreground">Editar meus dados</p>
        <MyProfileForm profile={profile} />
      </Card>

      <Card className="max-w-md p-6">
        <p className="mb-3 text-sm font-semibold text-foreground">Alterar minha senha</p>
        <ChangePasswordForm />
      </Card>

      <form action={logout} className="max-w-md">
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
        >
          Sair
        </button>
      </form>
    </div>
  );
}
