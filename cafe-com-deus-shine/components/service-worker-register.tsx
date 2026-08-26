"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // instalação do PWA ainda funciona sem o service worker; falha aqui
        // não deve quebrar o app.
      });
    }
  }, []);

  return null;
}
