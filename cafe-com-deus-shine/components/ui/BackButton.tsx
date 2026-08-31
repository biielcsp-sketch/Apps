"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

// Para telas de entrada (Dashboard/Início/Minha Jornada) não existe uma
// rota "pai" fixa — aqui o botão volta usa o histórico do navegador em
// vez de um href estático como o BackLink.
export function BackButton({ label = "Voltar" }: { label?: string }) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft size={16} />
      {label}
    </button>
  );
}
