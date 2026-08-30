"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  createDirectAccount,
  resetUserPassword,
  updateUserEmail,
} from "@/lib/services/accounts.service";
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

const ResetPasswordSchema = z.object({
  password: z.string().min(6, { error: "A senha precisa ter pelo menos 6 caracteres." }),
});

// Exclusiva do papel Desenvolvedor: redefine a senha de QUALQUER conta
// diretamente, sem passar pelo fluxo de "esqueci minha senha" por e-mail.
export async function resetUserPasswordAction(
  profileId: string,
  _state: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const profile = await getCurrentProfile();
  if (profile?.role !== "desenvolvedor") {
    return { error: "Apenas o perfil Desenvolvedor pode redefinir senhas." };
  }

  const validated = ResetPasswordSchema.safeParse({ password: formData.get("password") });
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? "Verifique a senha informada." };
  }

  try {
    await resetUserPassword(profileId, validated.data.password);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao redefinir a senha." };
  }

  return { success: true };
}

const UpdateEmailSchema = z.object({
  email: z.email({ error: "Informe um e-mail válido." }),
});

// Exclusiva do papel Desenvolvedor: troca o e-mail de login de QUALQUER
// conta diretamente, já confirmado (sem a usuária precisar clicar em link
// de verificação).
export async function updateUserEmailAction(
  profileId: string,
  _state: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const profile = await getCurrentProfile();
  if (profile?.role !== "desenvolvedor") {
    return { error: "Apenas o perfil Desenvolvedor pode alterar e-mails." };
  }

  const validated = UpdateEmailSchema.safeParse({ email: formData.get("email") });
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? "Verifique o e-mail informado." };
  }

  try {
    await updateUserEmail(profileId, validated.data.email);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao alterar o e-mail." };
  }

  revalidatePath(`/contas/${profileId}`);
  return { success: true };
}
