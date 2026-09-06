import Link from "next/link";

// Nav fixa em mix-blend-difference: ela inverte contra o que passa por
// baixo, então continua legível tanto sobre o hero escuro quanto sobre o
// bloco claro do formulário — sem precisar de JS de scroll.
export function LandingNav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 mix-blend-difference">
      <nav className="mx-auto flex max-w-[90rem] items-center justify-between gap-4 px-6 py-5 sm:px-8">
        <div className="flex items-center gap-2.5">
          <span className="landing-pulse h-2 w-2 shrink-0 rounded-full bg-[#5ba33f]" aria-hidden />
          <span className="whitespace-nowrap text-[11px] font-bold uppercase tracking-[0.18em] text-white sm:text-sm sm:tracking-[0.2em]">
            Café com Deus
          </span>
        </div>

        <div className="hidden items-center gap-8 md:flex">
          {[
            { href: "#sobre", label: "O que é" },
            { href: "#como-funciona", label: "Como funciona" },
            { href: "#inscricao", label: "Inscrição" },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-xs font-bold uppercase tracking-[0.2em] text-white transition-opacity duration-200 hover:opacity-60"
            >
              {item.label}
            </a>
          ))}
        </div>

        <Link
          href="#inscricao"
          className="whitespace-nowrap rounded-full border border-white/40 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white transition-transform duration-200 hover:scale-[1.02] sm:px-5 sm:text-xs sm:tracking-[0.2em]"
        >
          Quero participar
        </Link>
      </nav>
    </header>
  );
}
