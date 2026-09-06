"use client";

import { useEffect, useRef, useState } from "react";
import { Copy, Check } from "lucide-react";

const PATH = "/criar-acesso";

const inputClass =
  "w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary";

export function CopySignupLink() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);

  // O servidor não conhece o domínio, então ele renderiza o caminho
  // relativo e o efeito troca pelo link absoluto direto no input — sem
  // estado de React no meio, que aqui só serviria para disparar um
  // segundo render logo depois da hidratação.
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.value = `${window.location.origin}${PATH}`;
    }
  }, []);

  async function copyLink() {
    const link = inputRef.current?.value ?? PATH;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard indisponível — o link continua visível pra copiar manualmente.
    }
  }

  return (
    <div className="flex items-center gap-2">
      <input
        ref={inputRef}
        readOnly
        defaultValue={PATH}
        className={inputClass}
        onFocus={(e) => e.target.select()}
      />
      <button
        type="button"
        onClick={copyLink}
        aria-label="Copiar link"
        className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
      >
        {copied ? <Check size={16} className="text-primary" /> : <Copy size={16} />}
        {copied ? "Copiado" : "Copiar"}
      </button>
    </div>
  );
}
