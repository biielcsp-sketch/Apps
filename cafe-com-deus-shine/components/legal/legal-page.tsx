import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

// Moldura das páginas públicas de privacidade e termos. Sem menu e sem
// sessão: elas precisam abrir para qualquer visitante, inclusive para os
// robôs do Google que conferem o link antes de liberar a publicação do
// app OAuth.
export function LegalPage({
  title,
  updatedAt,
  children,
}: {
  title: string;
  updatedAt: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-10">
      <header className="flex flex-col items-center text-center">
        <Image
          src="/icons/logo-official.png"
          alt="Café com Deus Shine"
          width={876}
          height={866}
          className="h-24 w-auto"
          priority
        />
        <h1 className="mt-5 text-2xl font-semibold text-foreground">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Última atualização: {updatedAt}
        </p>
      </header>

      {/* prose-like à mão: o projeto não usa @tailwindcss/typography, e
          não vale trazer a dependência por duas páginas. */}
      <article
        className="mt-10 flex flex-col gap-4 text-[0.9375rem] leading-relaxed text-foreground
          [&_h2]:mt-6 [&_h2]:text-lg [&_h2]:font-semibold
          [&_li]:ml-5 [&_li]:list-disc [&_p]:text-muted-foreground
          [&_strong]:text-foreground [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1.5
          [&_ul]:text-muted-foreground"
      >
        {children}
      </article>

      <footer className="mt-12 border-t border-border pt-6 text-center">
        <Link href="/login" className="text-sm font-medium text-primary hover:underline">
          Voltar para o Café com Deus Shine
        </Link>
      </footer>
    </div>
  );
}
