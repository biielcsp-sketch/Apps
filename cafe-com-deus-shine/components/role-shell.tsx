import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin-shell";
import { LiderShell } from "@/components/lider-shell";
import { ParticipanteShell } from "@/components/participante-shell";
import { isAdminRole, type CurrentProfile } from "@/lib/services/profiles.service";
import { isLeaderRole, isHostRole } from "@/lib/role-labels";

// Rotas compartilhadas entre papéis (/meu-perfil, /estudos, /cafes) ficam
// fora dos route groups, então precisam escolher o Shell na mão. Esta é a
// única cópia dessa escolha — quando entra um papel novo, muda só aqui.
export function RoleShell({
  profile,
  avatarUrl,
  children,
}: {
  profile: CurrentProfile;
  avatarUrl: string | null;
  children: ReactNode;
}) {
  if (isAdminRole(profile.role)) {
    return (
      <AdminShell
        userName={profile.full_name}
        isDeveloper={profile.role === "desenvolvedor"}
        avatarUrl={avatarUrl}
      >
        {children}
      </AdminShell>
    );
  }

  // Co-líder usa o mesmo painel da líder — muda só o rótulo do papel, que
  // já vem do bloco de identidade.
  if (isLeaderRole(profile.role) || isHostRole(profile.role)) {
    return (
      <LiderShell userName={profile.full_name} avatarUrl={avatarUrl}>
        {children}
      </LiderShell>
    );
  }

  return (
    <ParticipanteShell userName={profile.full_name} avatarUrl={avatarUrl}>
      {children}
    </ParticipanteShell>
  );
}

// Para onde o botão "voltar" aponta em cada papel.
export function homePathFor(role: CurrentProfile["role"]) {
  if (isAdminRole(role)) return { href: "/dashboard", label: "Dashboard" };
  if (isLeaderRole(role) || isHostRole(role)) return { href: "/inicio", label: "Início" };
  return { href: "/minha-jornada", label: "Minha Jornada" };
}
