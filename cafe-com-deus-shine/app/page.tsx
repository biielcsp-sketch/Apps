import { redirect } from "next/navigation";
import { getCurrentProfile, isAdminRole } from "@/lib/services/profiles.service";
import { isLeaderRole, isHostRole } from "@/lib/role-labels";
import { getPublicEnrollmentCode } from "@/lib/services/public-enrollment.service";
import { getPublicCafeRules } from "@/lib/services/cafe-rules.service";
import { LandingNav } from "@/components/landing/landing-nav";
import { LandingHero } from "@/components/landing/landing-hero";
import { LandingSobre, LandingComoFunciona, LandingFooter } from "@/components/landing/landing-sections";
import { LandingFormSection } from "@/components/landing/landing-form-section";

// A landing tem conteúdo que depende do banco (origem de inscrição ativa e
// texto das regras), então nada de cache estático — se a pastora desativar
// a origem ou reescrever as regras, a página pública tem que refletir na
// hora.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Café com Deus Shine — inscreva-se",
  description:
    "Um encontro semanal de mulheres, em volta de um café, para ouvir a Palavra e caminhar juntas. Inscreva-se e encontramos o grupo mais perto de você.",
};

// A raiz agora tem dois públicos: quem já tem sessão continua caindo direto
// no painel do seu papel (nenhuma mudança de comportamento), e quem chega
// de fora vê a landing de inscrição.
export default async function RootPage() {
  const profile = await getCurrentProfile();

  if (profile) {
    if (isAdminRole(profile.role)) {
      redirect("/dashboard");
    }
    // Líder, co-líder e anfitriã caem no painel do café; participante vai
    // direto para a jornada dela.
    if (isLeaderRole(profile.role) || isHostRole(profile.role)) {
      redirect("/inicio");
    }
    redirect("/minha-jornada");
  }

  // Nem o código de origem nem as regras podem derrubar a página: sem
  // código, a seção mostra "inscrições fechadas"; sem regras, ela some.
  const [code, rules] = await Promise.all([
    getPublicEnrollmentCode().catch(() => null),
    getPublicCafeRules().catch(() => ""),
  ]);

  return (
    <div className="landing min-h-screen">
      <LandingNav />
      <main>
        <LandingHero />
        <LandingSobre />
        <LandingComoFunciona />
        <LandingFormSection code={code} rules={rules} />
      </main>
      <LandingFooter />
    </div>
  );
}
