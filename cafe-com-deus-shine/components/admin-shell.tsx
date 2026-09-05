"use client";

import { useState } from "react";
import Image from "next/image";
import {
  LayoutDashboard,
  Users,
  UserCog,
  Coffee,
  HeartHandshake,
  ShieldCheck,
  QrCode,
  BookOpen,
  ScrollText,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { NavLink } from "@/components/nav-link";
import { SidebarIdentity } from "@/components/ui/SidebarIdentity";
import { logout } from "@/app/actions/auth";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/participantes", label: "Participantes", icon: Users },
  { href: "/liderancas", label: "Líderes", icon: UserCog },
  { href: "/cafes", label: "Cafés", icon: Coffee },
  { href: "/acompanhamentos", label: "Acompanhamentos", icon: HeartHandshake },
  { href: "/estudos", label: "Estudo do mês", icon: BookOpen },
  { href: "/configuracoes/qrcodes", label: "QR Codes", icon: QrCode },
  { href: "/configuracoes/regras", label: "Regras do café", icon: ScrollText },
];

const DEVELOPER_NAV_ITEM = { href: "/contas", label: "Contas", icon: ShieldCheck };

export function AdminShell({
  userName,
  isDeveloper = false,
  avatarUrl,
  children,
}: {
  userName: string;
  isDeveloper?: boolean;
  avatarUrl?: string | null;
  children: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navItems = isDeveloper ? [...NAV_ITEMS, DEVELOPER_NAV_ITEM] : NAV_ITEMS;

  return (
    <div className="flex min-h-screen flex-1">
      {/* Sidebar — desktop */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-logo-panel px-4 py-6 md:flex">
        <div className="mb-6 flex justify-center px-2">
          <Image src="/icons/logo-official.png" alt="Café com Deus Shine" width={876} height={866} className="h-14 w-auto" />
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {navItems.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </nav>
        <div className="mt-4 border-t border-border pt-4">
          <SidebarIdentity
            userName={userName}
            avatarUrl={avatarUrl}
            roleLabel={isDeveloper ? "Desenvolvedor" : undefined}
          />
          <form action={logout}>
            <button
              type="submit"
              className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted"
            >
              <LogOut size={18} />
              Sair
            </button>
          </form>
        </div>
      </aside>

      {/* Drawer — mobile */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            aria-label="Fechar menu"
            className="absolute inset-0 bg-black/40"
            onClick={() => setMenuOpen(false)}
          />
          <aside className="absolute left-0 top-0 flex h-full w-72 flex-col bg-logo-panel px-4 py-6">
            <div className="mb-6 flex items-center justify-between px-2">
              <Image src="/icons/logo-official.png" alt="Café com Deus Shine" width={876} height={866} className="mx-auto h-12 w-auto" />
              <button aria-label="Fechar menu" onClick={() => setMenuOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <nav className="flex flex-1 flex-col gap-1">
              {navItems.map((item) => (
                <NavLink key={item.href} {...item} onNavigate={() => setMenuOpen(false)} />
              ))}
            </nav>
            <div className="mt-4 border-t border-border pt-4">
              <SidebarIdentity
                userName={userName}
                avatarUrl={avatarUrl}
                roleLabel={isDeveloper ? "Desenvolvedor" : undefined}
                onNavigate={() => setMenuOpen(false)}
              />
              <form action={logout}>
                <button
                  type="submit"
                  className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted"
                >
                  <LogOut size={18} />
                  Sair
                </button>
              </form>
            </div>
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar — mobile */}
        <header className="relative flex items-center border-b border-border bg-logo-panel px-4 py-3 md:hidden">
          <button aria-label="Abrir menu" onClick={() => setMenuOpen(true)} className="relative z-10">
            <Menu size={22} />
          </button>
          <Image
            src="/icons/logo-header-mobile.png"
            alt="Café com Deus Shine"
            width={1702}
            height={630}
            className="absolute left-1/2 h-12 w-auto -translate-x-1/2"
            priority
          />
        </header>

        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
