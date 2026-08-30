"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isAdminRole } from "@/lib/services/profiles.service";
import { checkLoginRateLimit } from "@/lib/rate-limit";
import { logAuthEvent } from "@/lib/services/auth-audit.service";

const LoginSchema = z.object({
  email: z.email({ error: "Informe um e-mail válido." }),
  password: z.string().min(1, { error: "Informe a senha." }),
});

export type LoginState = {
  error?: string;
} | undefined;

export async function login(_state: LoginState, formData: FormData): Promise<LoginState> {
  const validated = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validated.success) {
    return { error: "Verifique o e-mail e a senha informados." };
  }

  const allowed = await checkLoginRateLimit(validated.data.email);
  if (!allowed) {
    return { error: "Muitas tentativas de login. Aguarde alguns minutos e tente novamente." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(validated.data);

  if (error || !data.user) {
    await logAuthEvent("login_failed", null, { email: validated.data.email });
    return { error: "E-mail ou senha incorretos." };
  }

  await logAuthEvent("login_success", data.user.id);

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  if (isAdminRole(profile?.role)) {
    redirect("/dashboard");
  }
  if (profile?.role === "participante") {
    redirect("/minha-jornada");
  }
  redirect("/inicio");
}

export async function logout() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) await logAuthEvent("logout", user.id);
  await supabase.auth.signOut();
  redirect("/login");
}
