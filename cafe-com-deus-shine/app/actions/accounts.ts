"use server";

import { z } from "zod";
import { createDirectAccount } from "@/lib/services/accounts.service";
import { getCurrentProfile } from "@/lib/services/profiles.service";
import type { FormActionState } from "@/app/actions/participants";

const CreateDirectAccountSchema = z.object({
  fullName: z.string().trim().min(1, { error: "Informe o nome completo." }),
  email: z.email({ error: "Informe um e-mail válido." }),
  password: z.string().min(6, { error: "A senha precisa ter pelo menos 6 caracteres." }),
  role: z.enum(["admin", "desenvolvedor"], { error: "Selecione um papel válido." }),
});

// Exclusiva do papel Desenvolvedor: cria uma conta administrativa (admin ou
// desenvolvedor) já com senha definida, sem passar por convite por e-mail.
// Líder e participante têm seus próprios fluxos (que também criam o
// registro em `leaders`/`participants`) e não passam por aqui.
export async function createDirectAccountAction(
  _state: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const profile = await getCurrentProfile();
  if (profile?.role !== "desenvolvedor") {
    return { error: "Apenas o perfil Desenvolvedor pode criar contas diretamente." };
  }

  const validated = CreateDirectAccountSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });

  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? "Verifique os campos do formulário." };
  }

  try {
    await createDirectAccount(validated.data);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao criar a conta." };
  }

  return { success: true };
}
