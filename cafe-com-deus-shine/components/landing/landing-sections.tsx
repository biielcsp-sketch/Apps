const PILLARS = [
  {
    label: "01",
    title: "Palavra",
    body: "Cada encontro tem um tema do mês e uma palavra ministrada, para levar junto na semana.",
  },
  {
    label: "02",
    title: "Mesa",
    body: "Um café de verdade, na casa de alguém do seu bairro. Sem palco, sem plateia.",
  },
  {
    label: "03",
    title: "Caminho",
    body: "Você entra num grupo pequeno, com uma líder que acompanha sua caminhada de perto.",
  },
];

const STEPS = [
  {
    step: "Passo 1",
    title: "Você se inscreve",
    body: "Preenche o formulário aqui embaixo contando onde mora e quando consegue participar. Leva menos de três minutos.",
  },
  {
    step: "Passo 2",
    title: "Encontramos seu café",
    body: "Nossa equipe procura o grupo mais perto de você, com dia e horário que caibam na sua rotina.",
  },
  {
    step: "Passo 3",
    title: "Sua líder entra em contato",
    body: "Ela te chama no WhatsApp, se apresenta e te conta tudo sobre o primeiro encontro.",
  },
  {
    step: "Passo 4",
    title: "Você acompanha pelo app",
    body: "Depois de se inscrever, você cria seu acesso e vê os próximos encontros, o tema do mês e a Bíblia num lugar só.",
  },
];

export function LandingSobre() {
  return (
    <section id="sobre" className="relative overflow-hidden px-6 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto max-w-[90rem]">
        <h2 className="text-[13vw] font-black uppercase leading-[0.85] tracking-tighter text-[#fdf8f3] sm:text-[10vw]">
          O que é
        </h2>
        <p className="mt-8 max-w-[46ch] text-lg font-light leading-relaxed text-[#b8a894]">
          O Café com Deus Shine é um encontro semanal de mulheres em grupos pequenos,
          espalhados pelos bairros. Cada grupo tem uma líder, um endereço e um horário —
          e a mesma Palavra no mês.
        </p>

        <div className="mt-16 grid grid-cols-1 gap-4 md:grid-cols-3">
          {PILLARS.map((pillar) => (
            <article
              key={pillar.label}
              className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur-md"
            >
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#c99a4b]">
                {pillar.label}
              </p>
              <h3 className="mt-5 text-3xl font-black uppercase tracking-tight text-[#fdf8f3]">
                {pillar.title}
              </h3>
              <p className="mt-3 text-base font-light leading-relaxed text-[#b8a894]">
                {pillar.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LandingComoFunciona() {
  const [featured, ...rest] = STEPS;

  return (
    <section id="como-funciona" className="relative overflow-hidden px-6 py-24 sm:px-8 sm:py-32">
      <div className="landing-glow right-0 top-1/4 h-[36vh] w-[36vh]" aria-hidden />
      <div className="mx-auto max-w-[90rem]">
        <h2 className="text-[13vw] font-black uppercase leading-[0.85] tracking-tighter text-[#fdf8f3] sm:text-[10vw]">
          Como funciona
        </h2>

        {/* Primeiro passo em destaque, como o "projeto em destaque" do
            estilo — com os três pontinhos de janela do macOS. */}
        <article className="mt-12 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-md">
          <div className="flex items-center gap-2 border-b border-white/10 px-5 py-3">
            <span className="h-3 w-3 rounded-full bg-[#ff5f57]" aria-hidden />
            <span className="h-3 w-3 rounded-full bg-[#febc2e]" aria-hidden />
            <span className="h-3 w-3 rounded-full bg-[#28c840]" aria-hidden />
          </div>
          <div className="p-8 sm:p-14">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#c99a4b]">
              {featured.step}
            </p>
            <h3 className="mt-5 text-4xl font-black uppercase leading-none tracking-tighter text-[#fdf8f3] sm:text-6xl">
              {featured.title}
            </h3>
            <p className="mt-5 max-w-[46ch] text-lg font-light leading-relaxed text-[#b8a894]">
              {featured.body}
            </p>
          </div>
        </article>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          {rest.map((item) => (
            <article
              key={item.step}
              className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur-md"
            >
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#c99a4b]">
                {item.step}
              </p>
              <h3 className="mt-5 text-2xl font-black uppercase tracking-tight text-[#fdf8f3]">
                {item.title}
              </h3>
              <p className="mt-3 text-base font-light leading-relaxed text-[#b8a894]">
                {item.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LandingFooter() {
  return (
    <footer className="border-t border-white/10 px-6 py-16 sm:px-8">
      <div className="mx-auto max-w-[90rem]">
        <p className="text-[13vw] font-black uppercase leading-[0.85] tracking-tighter text-[#fdf8f3] sm:text-[9vw]">
          Café com Deus Shine
        </p>
        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#b8a894]">
            Um encontro por semana, uma mesa de cada vez
          </p>
          <a
            href="/login"
            className="text-xs font-bold uppercase tracking-[0.2em] text-[#c99a4b] transition-opacity duration-200 hover:opacity-70"
          >
            Já participo — entrar
          </a>
        </div>
      </div>
    </footer>
  );
}
