import Image from "next/image";
import { validateEnrollmentSource } from "@/lib/services/public-enrollment.service";
import { getCafeRules } from "@/lib/services/cafe-rules.service";
import { PublicEnrollmentForm } from "@/components/cadastro-publico/public-enrollment-form";
import { Card } from "@/components/ui/Card";
import { BackButton } from "@/components/ui/BackButton";

type SearchParams = { origem?: string };

// Rota pública (fora de (admin)/(lider)/(auth)/(participante)) — layout
// próprio e minimalista, sem menu de navegação interna do sistema. A
// visitante que escaneou o QR Code não deve ver nada do painel.
export default async function CadastroPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { origem } = await searchParams;
  // Falha-fechado: se a checagem em si der erro (instabilidade do banco,
  // por exemplo), trata como link inválido em vez de estourar um 500 pra
  // quem só escaneou um QR Code num evento — o erro real já fica logado
  // no servidor por dbError().
  const isValidSource = origem
    ? await validateEnrollmentSource(origem).catch(() => false)
    : false;

  // As regras nunca podem derrubar o formulário: se a leitura falhar, a
  // inscrição continua funcionando sem o bloco de regras.
  const cafeRules = isValidSource ? await getCafeRules().catch(() => "") : "";

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <BackButton />
        <div className="mt-4 mb-6 flex flex-col items-center text-center">
          <Image
            src="/icons/logo-official.png"
            alt="Café com Deus Shine"
            width={876}
            height={866}
            className="h-32 w-auto"
            priority
          />
        </div>

        <Card className="p-6 sm:p-8">
          {!isValidSource ? (
            <div className="flex flex-col items-center gap-2 text-center">
              <h1 className="text-lg font-semibold text-foreground">Link expirado</h1>
              <p className="text-sm text-muted-foreground">
                Este link de inscrição não está mais disponível. Fale com quem te passou o
                QR Code para conseguir um novo.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6 text-center">
                <h1 className="text-lg font-semibold text-foreground">Quero participar</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Deixe seus dados que nossa equipe entra em contato.
                </p>
              </div>
              {cafeRules && (
                <div className="mb-6 rounded-xl border border-border bg-muted p-4">
                  <p className="mb-2 text-sm font-semibold text-foreground">Como funciona o café</p>
                  <p className="whitespace-pre-line text-sm text-muted-foreground">{cafeRules}</p>
                </div>
              )}
              <PublicEnrollmentForm code={origem!} />
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
