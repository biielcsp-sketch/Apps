"use client";

import dynamic from "next/dynamic";

// Leaflet toca em `window`/`document` já na importação do módulo — não é
// seguro em SSR. Carregado só no cliente.
export const GroupLocationEditor = dynamic(
  () => import("@/components/grupos/group-location-editor").then((m) => m.GroupLocationEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[360px] items-center justify-center rounded-2xl border border-border bg-muted">
        <p className="text-sm text-muted-foreground">Carregando mapa...</p>
      </div>
    ),
  },
);
