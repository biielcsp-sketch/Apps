"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";

export function NavLink({
  href,
  label,
  icon: Icon,
  onNavigate,
  variant = "sidebar",
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  onNavigate?: () => void;
  variant?: "sidebar" | "tab";
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);

  if (variant === "tab") {
    return (
      <Link
        href={href}
        onClick={onNavigate}
        className={`flex flex-1 flex-col items-center gap-1 py-2 text-xs ${
          active ? "text-primary" : "text-muted-foreground"
        }`}
      >
        <Icon size={20} strokeWidth={active ? 2.5 : 2} />
        {label}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
        active
          ? "bg-primary text-primary-foreground"
          : "text-foreground hover:bg-muted"
      }`}
    >
      <Icon size={18} strokeWidth={active ? 2.5 : 2} />
      {label}
    </Link>
  );
}
