"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { X, Download } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "ccd-install-dismissed";

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const alreadyDismissed = localStorage.getItem(DISMISSED_KEY) === "1";
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      if (alreadyDismissed || isStandalone) return;
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setVisible(true);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  if (!visible || !deferredPrompt) return null;

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setVisible(false);
  }

  function handleDismiss() {
    localStorage.setItem(DISMISSED_KEY, "1");
    setVisible(false);
  }

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-sm items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-lg">
      <Image
        src="/icons/icon-192.png"
        alt="Café com Deus"
        width={48}
        height={48}
        className="rounded-xl"
      />
      <div className="flex-1">
        <p className="text-sm font-semibold text-foreground">Café com Deus</p>
        <p className="text-xs text-muted-foreground">Instale o app na tela inicial</p>
      </div>
      <button
        onClick={handleInstall}
        aria-label="Instalar aplicativo"
        className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground"
      >
        <Download size={14} />
        Instalar
      </button>
      <button
        onClick={handleDismiss}
        aria-label="Fechar"
        className="text-muted-foreground"
      >
        <X size={18} />
      </button>
    </div>
  );
}
