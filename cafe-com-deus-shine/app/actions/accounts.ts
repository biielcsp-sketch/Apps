"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  createDirectAccount,
  createDirectLeaderAccount,
  createDirectParticipantAccount,
  updateAccount,
  resetUserPassword,
  updateUserEmail,
} from "@/lib/services/accounts.service";
import { getCurrentProfile } from "@/lib/services/profiles.service";
import type { FormActionState } from "@/app/actions/participants";

function readOptionalString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() !== "" ? value : undefined;
}

const SystemAccountSchema = z.object({
  fullName: z.string().trim().min(1, { error: "Informe o nome completo." }),
  email: z.email({ error: "Informe um e-mail válido." }),
  password: z.string().min(6, { error: "A senha precisa ter pelo menos 6 caracteres." }),
});

const LeaderAccountSchema = z.object({
  fullName: z.string().trim().min(2, { error: "Informe o nome completo." }),
  email: z.email({ error: "Informe um e-mail válido." }),
  password: z.string().min(6, { error: "A senha precisa ter pelo menos 6 caracteres." }),
  phone: z.string().trim().optional(),
  whatsapp: z.string().trim().optional(),
  city: z.string().trim().optional(),
  neighborhood: z.string().trim().optional(),
  meetingAddress: z.string().trim().optional(),
  region: z.string().trim().optional(),
  maxCapacity: z.coerce.number().int().positive({ error: "A capacidade deve ser maior que zero." }),
});

const ParticipantAccountSchema = z.object({
  participantId: z.uuid({ error: "Selecione uma participante." }),
  email: z.email({ error: "Informe um e-mail válido." }),
  password: z.string().min(6, { error: "A senha precisa ter pelo menos 6 caracteres." }),
});

// Exclusiva do papel Desenvolvedor: cria conta com senha já definida, sem
// convite por e-mail nem autocadastro. Um só formulário, três caminhos
// conforme o papel escolhido — líder e participante continuam exigindo os
// dados vinculados (leaders/participants), só muda como a senha chega.
export async function createAccountAction(
  _state: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const profile = await getCurrentProfile();
  if (profile?.role !== "desenvolvedor") {
    return { error: "Apenas o perfil Desenvolvedor pode criar contas diretamente." };
  }

  const role = formData.get("role");

  if (role === "admin" || role === "desenvolvedor") {
    const validated = SystemAccountSchema.safeParse({
      fullName: formData.get("fullName"),
      email: formData.get("email"),
      password: formData.get("password"),
    });
    if (!validated.success) {
      return { error: validated.error.issues[0]?.message ?? "Verifique os campos do formulário." };
    }
    try {
      await createDirectAccount({ ...validated.data, role });
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Erro ao criar a conta." };
    }
    return { success: true };
  }

  if (role === "lider") {
    const validated = LeaderAccountSchema.safeParse({
      fullName: formData.get("fullName"),
      email: formData.get("email"),
      password: formData.get("password"),
      phone: readOptionalString(formData, "phone"),
      whatsapp: readOptionalString(formData, "whatsapp"),
      city: readOptionalString(formData, "city"),
      neighborhood: readOptionalString(formData, "neighborhood"),
      meetingAddress: readOptionalString(formData, "meetingAddress"),
      region: readOptionalString(formData, "region"),
      maxCapacity: formData.get("maxCapacity"),
    });
    if (!validated.success) {
      return { error: validated.error.issues[0]?.message ?? "Verifique os campos do formulário." };
    }
    try {
      await createDirectLeaderAccount(validated.data);
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Erro ao criar a conta." };
    }
    return { success: true };
  }

  if (role === "participante") {
    const validated = ParticipantAccountSchema.safeParse({
      participantId: formData.get("participantId"),
      email: formData.get("email"),
      password: formData.get("password"),
    });
    if (!validated.success) {
      return { error: validated.error.issues[0]?.message ?? "Verifique os campos do formulário." };
    }
    try {
      await createDirectParticipantAccount(validated.data);
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Erro ao criar a conta." };
    }
    return { success: true };
  }

  return { error: "Selecione um papel válido." };
}

const UpdateAccountSchema = z.object({
  fullName: z.string().trim().min(1, { error: "Informe o nome completo." }),
  role: z.enum(["admin", "desenvolvedor"], { error: "Selecione um papel válido." }),
});

// Exclusiva do papel Desenvolvedor: edita nome e/ou papel de uma conta já
// existente. Trocar para/de Líder ou Participante não é permitido aqui —
// ver o porquê no comentário de updateAccount() no service.
export async function updateAccountAction(
  profileId: string,
  _state: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const profile = await getCurrentProfile();
  if (profile?.role !== "desenvolvedor") {
    return { error: "Apenas o perfil Desenvolvedor pode editar contas." };
  }

  const validated = UpdateAccountSchema.safeParse({
    fullName: formData.get("fullName"),
    role: formData.get("role"),
  });
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? "Verifique os campos do formulário." };
  }

  try {
    await updateAccount(profileId, validated.data);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao salvar." };
  }

  revalidatePath(`/contas/${profileId}`);
  revalidatePath("/contas");
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
