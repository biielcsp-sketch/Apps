import Image from "next/image";
import { LoginForm } from "@/components/login-form";
import { Card } from "@/components/ui/Card";

export default function LoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <Card className="w-full max-w-sm p-8">
        <div className="mb-8 flex flex-col items-center text-center">
          <Image
            src="/icons/icon-512.png"
            alt="Café com Deus"
            width={72}
            height={72}
            className="rounded-2xl"
            priority
          />
          <h1 className="mt-3 text-xl font-semibold text-foreground">Café com Deus</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Entre com sua conta para continuar
          </p>
        </div>
        <LoginForm />
      </Card>
    </div>
  );
}
