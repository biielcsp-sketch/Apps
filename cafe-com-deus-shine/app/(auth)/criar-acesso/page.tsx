import Image from "next/image";
import { ClaimAccountForm } from "@/components/claim-account-form";
import { Card } from "@/components/ui/Card";

export default function CriarAcessoPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <Card className="w-full max-w-sm bg-logo-panel p-8">
        <div className="mb-8 flex flex-col items-center text-center">
          <Image
            src="/icons/logo-official.png"
            alt="Café com Deus Shine"
            width={876}
            height={866}
            className="h-40 w-auto"
            priority
          />
          <p className="mt-3 text-sm text-muted-foreground">
            Use o e-mail do seu cadastro para criar seu acesso
          </p>
        </div>
        <ClaimAccountForm />
      </Card>
    </div>
  );
}
