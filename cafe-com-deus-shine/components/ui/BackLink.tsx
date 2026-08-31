import Link from "next/link";
import { ArrowLeft } from "lucide-react";

// Botão "← Voltar" presente em toda tela que não é destino direto do menu
// lateral (detalhe, edição, criação) — sempre com destino explícito (não
// router.back()/history), pra funcionar igual mesmo quando a tela foi
// aberta direto por link/deep link, sem histórico de navegação por trás.
export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft size={16} />
      {label}
    </Link>
  );
}
