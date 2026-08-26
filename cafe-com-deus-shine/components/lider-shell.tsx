"use client";

import {
  Home,
  Users,
  CalendarDays,
  HeartHandshake,
  History,
  LogOut,
} from "lucide-react";
import { NavLink } from "@/components/nav-link";
import { logout } from "@/app/actions/auth";

const NAV_ITEMS = [
  { href: "/inicio", label: "Início", icon: Home },
  { href: "/minhas-participantes", label: "Participantes", icon: Users },
  { href: "/meus-encontros", label: "Encontros", icon: CalendarDays },
  { href: "/acompanhamentos", label: "Acompanhar", icon: HeartHandshake },
  { href: "/historico", label: "Histórico", icon: History },
];

export function LiderShell({
  userName,
  children,
}: {
  userName: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-1">
      {/* Sidebar — desktop */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card px-4 py-6 md:flex">
        <p className="mb-6 px-2 text-lg font-semibold text-foreground">Café com Deus Shine</p>
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

      <div className="flex flex-1 flex-col">
        {/* Top bar — mobile */}
        <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3 md:hidden">
          <p className="text-base font-semibold text-foreground">Olá, {userName.split(" ")[0]}</p>
          <form action={logout}>
            <button aria-label="Sair" type="submit" className="text-muted-foreground">
              <LogOut size={20} />
            </button>
          </form>
        </header>

        <main className="flex-1 p-4 pb-20 md:p-8 md:pb-8">{children}</main>

        {/* Tab bar — mobile */}
        <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-border bg-card md:hidden">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.href} {...item} variant="tab" />
          ))}
        </nav>
      </div>
    </div>
  );
}
