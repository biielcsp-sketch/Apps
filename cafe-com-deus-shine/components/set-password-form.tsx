"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

type Status = "checking" | "ready" | "invalid";

const inputClass =
  "rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary";

export function SetPasswordForm() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("checking");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // O link de convite/recuperação estabelece a sessão do lado do
  // navegador assim que o cliente Supabase processa o token da URL —
  // não há nada pra buscar do servidor aqui.
  useEffect(() => {
    const supabase = createClient();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setStatus(session ? "ready" : "invalid");
    });
    const timeout = setTimeout(() => {
      setStatus((s) => (s === "checking" ? "invalid" : s));
    }, 5000);

    return () => {
      listener.subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setPending(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setPending(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    router.push("/minha-jornada");
  }

  if (status === "checking") {
    return <p className="text-sm text-muted-foreground">Verificando o link...</p>;
  }

  if (status === "invalid") {
    return (
      <p className="text-sm text-danger">
        Este link é inválido ou expirou. Peça para a administradora gerar um novo convite.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium text-foreground">
          Nova senha
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
          Confirmar senha
        </label>
        <input
          id="confirmPassword"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className={inputClass}
        />
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <Button type="submit" disabled={pending} className="mt-2 w-full">
        {pending ? "Salvando..." : "Definir senha e entrar"}
      </Button>
    </form>
  );
}
