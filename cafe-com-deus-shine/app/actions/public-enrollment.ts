"use server";

import { headers } from "next/headers";
import { PublicEnrollmentSchema } from "@/lib/validators/public-enrollment.schema";
import { submitPublicEnrollment } from "@/lib/services/public-enrollment.service";
import { toUserMessage } from "@/lib/errors";

export type PublicEnrollmentActionState =
  | { status: "success" }
  | { status: "duplicate" }
  | { status: "error"; error: string }
  | undefined;

function readOptionalString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() !== "" ? value : undefined;
}

function readArray(formData: FormData, key: string) {
  const values = formData.getAll(key).map(String).filter(Boolean);
  return values.length > 0 ? values : undefined;
}

// Mesmo padrão de captura de IP do auth-audit.service.ts (S5) — usado aqui
// só para a chave do rate limit por IP, nunca gravado como identificador
// de participante.
async function clientIp() {
  const h = await headers();
  return h.get("x-nf-client-connection-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export async function submitPublicEnrollmentAction(
  _state: PublicEnrollmentActionState,
  formData: FormData,
): Promise<PublicEnrollmentActionState> {
  const validated = PublicEnrollmentSchema.safeParse({
    full_name: formData.get("full_name"),
    phone: formData.get("phone"),
    whatsapp: readOptionalString(formData, "whatsapp"),
    email: readOptionalString(formData, "email"),
    birth_date: readOptionalString(formData, "birth_date"),
    city: readOptionalString(formData, "city"),
    neighborhood: readOptionalString(formData, "neighborhood"),
    address: readOptionalString(formData, "address"),
    availability_days: readArray(formData, "availability_days"),
    availability_period: readArray(formData, "availability_period"),
    location_preference: readOptionalString(formData, "location_preference"),
    consent_accepted: formData.get("consent_accepted") === "on",
    code: formData.get("code"),
    website: readOptionalString(formData, "website"),
  });

  if (!validated.success) {
    return { status: "error", error: validated.error.issues[0]?.message ?? "Verifique os campos do formulário." };
  }

  try {
    const result = await submitPublicEnrollment(validated.data, await clientIp());
    // "discarded" (honeypot) responde como sucesso genérico de propósito —
    // nunca ensina o bot a se adaptar revelando que foi descartado.
    if (result === "duplicate") return { status: "duplicate" };
    return { status: "success" };
  } catch (e) {
    return {
      status: "error",
      error: toUserMessage(e, "actions.publicEnrollment.submit", "Não foi possível enviar sua inscrição. Tente novamente."),
    };
  }
}
