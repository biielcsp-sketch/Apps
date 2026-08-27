"use client";

import { useEffect, useState } from "react";
import { Copy, Check } from "lucide-react";

const inputClass =
  "w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary";

export function CopySignupLink() {
  const [link, setLink] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setLink(`${window.location.origin}/criar-acesso`);
  }, []);

  async function copyLink() {
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
      <input readOnly value={link} className={inputClass} onFocus={(e) => e.target.select()} />
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
