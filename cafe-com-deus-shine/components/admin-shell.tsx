"use client";

import { useState } from "react";
import Image from "next/image";
import {
  LayoutDashboard,
  Users,
  UserCog,
  Home,
  CalendarDays,
  HeartHandshake,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { NavLink } from "@/components/nav-link";
import { logout } from "@/app/actions/auth";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/participantes", label: "Participantes", icon: Users },
  { href: "/liderancas", label: "Líderes", icon: UserCog },
  { href: "/grupos", label: "Grupos", icon: Home },
  { href: "/encontros", label: "Encontros", icon: CalendarDays },
  { href: "/acompanhamentos", label: "Acompanhamentos", icon: HeartHandshake },
];

export function AdminShell({
  userName,
  children,
}: {
  userName: string;
  children: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-1">
      {/* Sidebar — desktop */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-logo-panel px-4 py-6 md:flex">
        <div className="mb-6 flex justify-center px-2">
          <Image src="/icons/logo-official.png" alt="Café com Deus Shine" width={876} height={866} className="h-14 w-auto" />
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </nav>
        <div className="mt-4 border-t border-border pt-4">
          <p className="truncate px-2 text-sm text-muted-foreground">{userName}</p>
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
              {NAV_ITEMS.map((item) => (
                <NavLink key={item.href} {...item} onNavigate={() => setMenuOpen(false)} />
              ))}
            </nav>
            <div className="mt-4 border-t border-border pt-4">
              <p className="truncate px-2 text-sm text-muted-foreground">{userName}</p>
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

      <div className="flex flex-1 flex-col">
        {/* Top bar — mobile */}
        <header className="flex items-center gap-3 border-b border-border bg-logo-panel px-4 py-3 md:hidden">
          <button aria-label="Abrir menu" onClick={() => setMenuOpen(true)}>
            <Menu size={22} />
          </button>
          <Image src="/icons/logo-official.png" alt="Café com Deus Shine" width={876} height={866} className="h-10 w-auto" />
        </header>

        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
