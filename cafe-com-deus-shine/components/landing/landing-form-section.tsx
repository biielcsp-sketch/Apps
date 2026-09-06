import { PublicEnrollmentForm } from "@/components/cadastro-publico/public-enrollment-form";

// O formulário reaproveita o componente do cadastro por QR Code — mesma
// validação, mesmo consentimento, mesma Server Action. Ele é claro por
// natureza (campos grandes, alto contraste), então a seção quebra o escuro
// de propósito: é onde a leitora precisa enxergar bem o que digita.
export function LandingFormSection({
  code,
  rules,
}: {
  code: string | null;
  rules: string;
}) {
  return (
    <section id="inscricao" className="relative overflow-hidden px-6 py-24 sm:px-8 sm:py-32">
      <div className="landing-glow left-1/4 top-0 h-[36vh] w-[36vh]" aria-hidden />
      <div className="mx-auto max-w-3xl">
        <h2 className="text-[13vw] font-black uppercase leading-[0.85] tracking-tighter text-[#fdf8f3] sm:text-[10vw]">
          Inscrição
        </h2>
        <p className="mt-8 max-w-[46ch] text-lg font-light leading-relaxed text-[#b8a894]">
          Conte um pouco sobre você e onde mora. A partir daí, nossa equipe encontra o café
          mais perto e sua líder entra em contato.
        </p>

        {rules && (
          <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur-md">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#c99a4b]">
              Como funciona o café
            </p>
            <p className="mt-4 whitespace-pre-line text-base font-light leading-relaxed text-[#b8a894]">
              {rules}
            </p>
          </div>
        )}

        <div className="mt-10 rounded-3xl bg-[#fdf8f3] p-6 text-foreground sm:p-10">
          {code ? (
            <PublicEnrollmentForm code={code} />
          ) : (
            <div className="text-center">
              <p className="text-lg font-semibold text-foreground">
                As inscrições estão fechadas no momento
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Fale com a equipe do Café com Deus Shine para saber da próxima turma.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
