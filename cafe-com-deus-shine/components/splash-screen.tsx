"use client";

import { useEffect, useState } from "react";

const MAX_DURATION_MS = 2800;

// Tela de abertura do app: mostra o vídeo da xícara de café em tela cheia
// assim que o app carrega (incluindo o PWA instalado no celular) e some
// sozinha em seguida. Só monta uma vez por carregamento real da página —
// navegações internas do App Router não remontam o layout raiz, então não
// reaparece ao trocar de aba dentro do app.
export function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFadingOut(true), MAX_DURATION_MS);
    const hideTimer = setTimeout(() => setVisible(false), MAX_DURATION_MS + 300);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  function dismiss() {
    setFadingOut(true);
    setTimeout(() => setVisible(false), 300);
  }

  return (
    <div
      onClick={dismiss}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-background transition-opacity duration-300 ${
        fadingOut ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <video
        src="/media/coffee-splash.mp4"
        autoPlay
        muted
        playsInline
        onEnded={dismiss}
        className="h-48 w-48 object-contain"
      />
      <p className="mt-4 text-lg font-semibold text-foreground">Café com Deus Shine</p>
    </div>
  );
}
