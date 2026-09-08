import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChangePasswordForm } from "@/components/change-password-form";
import { Card } from "@/components/ui/Card";

// Só quem entrou com senha provisória cai aqui — o proxy.ts empurra pra cá
// enquanto a flag estiver de pé. Quem chega sem sessão vai pro login; quem
// chega com a senha já trocada não tem nada a fazer nesta tela.
export default async function TrocarSenhaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  if (user.user_metadata?.must_change_password !== true) redirect("/");

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <Card className="w-full max-w-sm bg-logo-panel p-8">
        <div className="mb-8 flex flex-col items-center text-center">
          <Image
            src="/icons/logo-cafe-com-deus.png"
            alt="Café com Deus Shine"
            width={900}
            height={562}
            className="h-40 w-auto"
            priority
          />
          <h1 className="mt-4 text-lg font-semibold text-foreground">Crie sua senha</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Você entrou com a senha provisória. Escolha uma senha só sua para continuar.
          </p>
        </div>
        <ChangePasswordForm />
      </Card>
    </div>
  );
}
