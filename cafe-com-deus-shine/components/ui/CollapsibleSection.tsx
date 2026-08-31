"use client";

import { useId, useState, type ReactNode } from "react";
import { ChevronDown, Search } from "lucide-react";

export function CollapsibleSection({
  title,
  count,
  search,
  defaultOpen = false,
  children,
}: {
  title: string;
  count?: number;
  search?: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
  };
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const bodyId = useId();

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={bodyId}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
      >
        <span className="text-sm font-semibold text-foreground">
          {title}
          {typeof count === "number" && <span className="text-muted-foreground"> ({count})</span>}
        </span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div id={bodyId} className="border-t border-border">
          {search && (
            <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
              <Search size={15} className="shrink-0 text-muted-foreground" />
              <input
                type="text"
                value={search.value}
                onChange={(e) => search.onChange(e.target.value)}
                placeholder={search.placeholder ?? "Buscar..."}
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
          )}
          {children}
        </div>
      )}
    </div>
  );
}
