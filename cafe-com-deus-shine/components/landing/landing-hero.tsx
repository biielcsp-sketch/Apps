import Image from "next/image";

// As quatro faces do cubo. Sem banco de imagens de terceiros: o que gira
// é a própria identidade do café — logo e as palavras que definem o
// encontro — em vez de foto genérica de stock.
const FACES = [
  { title: "Café com Deus", subtitle: "Um encontro por semana", logo: true },
  { title: "Palavra", subtitle: "Que sustenta a semana inteira" },
  { title: "Mulheres", subtitle: "Caminhando juntas" },
  { title: "Perto de você", subtitle: "Um café no seu bairro" },
];

export function LandingHero() {
  return (
    <section className="landing-stage relative flex min-h-[100svh] flex-col overflow-hidden px-6 pb-12 pt-28">
      <div className="landing-glow left-1/2 top-1/3 h-[40vh] w-[40vh] -translate-x-1/2" aria-hidden />

      {/* Palavra gigante ao fundo, no espírito editorial do estilo. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 select-none text-center text-[26vw] font-black uppercase leading-none tracking-tighter text-white/[0.04]"
      >
        Shine
      </span>

      {/* O cubo fica numa faixa flexível, e o bloco de texto logo abaixo em
          fluxo normal — nada absoluto, então em tela baixa um empurra o
          outro em vez de sobrepor. */}
      <div className="flex flex-1 items-center justify-center">
        <div className="landing-cube">
          {FACES.map((face) => (
            <div key={face.title} className="landing-cube-face">
              {face.logo && (
                <Image
                  src="/icons/icon-512.png"
                  alt=""
                  width={512}
                  height={512}
                  priority
                  className="h-16 w-16 rounded-2xl object-cover sm:h-20 sm:w-20"
                />
              )}
              <p className="text-xl font-black uppercase tracking-[0.2em] text-[#fdf8f3] sm:text-2xl">
                {face.title}
              </p>
              <p className="max-w-[22ch] text-sm font-light text-[#b8a894]">{face.subtitle}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="relative mt-12 flex flex-col items-center gap-5 text-center">
        <p className="max-w-[34ch] text-base font-light leading-relaxed text-[#b8a894] sm:text-lg">
          Um encontro semanal de mulheres, em volta de um café, para ouvir a Palavra e
          caminhar juntas.
        </p>
        <a
          href="#inscricao"
          className="rounded-full bg-gradient-to-r from-[#c99a4b] to-[#e8c77e] px-8 py-4 text-sm font-bold uppercase tracking-[0.2em] text-[#1a120b] transition-transform duration-200 hover:scale-[1.02]"
        >
          Quero me inscrever
        </a>
      </div>
    </section>
  );
}
