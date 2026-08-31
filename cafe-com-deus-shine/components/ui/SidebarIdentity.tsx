import Link from "next/link";

export function SidebarIdentity({
  userName,
  avatarUrl,
  roleLabel,
  onNavigate,
}: {
  userName: string;
  avatarUrl?: string | null;
  roleLabel?: string;
  onNavigate?: () => void;
}) {
  const initial = userName.trim().charAt(0).toUpperCase() || "?";

  return (
    <Link
      href="/meu-perfil"
      onClick={onNavigate}
      className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-muted"
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- URL assinada e temporária, não vale a pena passar pelo otimizador do next/image
        <img src={avatarUrl} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
      ) : (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
          {initial}
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate text-sm text-muted-foreground">{userName}</p>
        {roleLabel && <p className="text-xs font-medium text-primary">{roleLabel}</p>}
      </div>
    </Link>
  );
}
