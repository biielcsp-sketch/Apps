import "server-only";
import { createClient } from "@/lib/supabase/server";

// S4 (rate limiting): sem Upstash (exigiria criar conta de terceiro sem
// aprovação prévia) e sem Map em memória (não sobrevive a múltiplas
// instâncias serverless) — os limites reais ficam fixos em funções
// SECURITY DEFINER no Postgres (ver migration s4_rate_limiting.sql), que já
// é compartilhado entre todas as instâncias por natureza. Aqui só chamamos
// a função certa por chave.
type RateLimitRpc =
  | "app_check_login_rate_limit"
  | "app_check_claim_account_rate_limit"
  | "app_check_erasure_rate_limit"
  | "app_check_participant_write_rate_limit"
  | "app_check_public_enrollment_rate_limit";

async function hit(rpc: RateLimitRpc, key: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc(rpc, { p_key: key });

  if (error) {
    // Uma falha no rate limiter (ex.: instabilidade momentânea do banco)
    // nunca pode travar uma ação legítima — loga e libera (fail-open).
    console.error(`[rate-limit] ${rpc} falhou, liberando por padrão:`, error.message);
    return true;
  }

  return data === true;
}

export function checkLoginRateLimit(email: string) {
  return hit("app_check_login_rate_limit", email.trim().toLowerCase());
}

export function checkClaimAccountRateLimit(email: string) {
  return hit("app_check_claim_account_rate_limit", email.trim().toLowerCase());
}

export function checkErasureRateLimit(userId: string) {
  return hit("app_check_erasure_rate_limit", userId);
}

export function checkParticipantWriteRateLimit(userId: string) {
  return hit("app_check_participant_write_rate_limit", userId);
}

// Q1 (cadastro público via QR Code): por IP, não por usuária — quem
// preenche o formulário público ainda não tem sessão nem e-mail conhecido
// até o submit terminar.
export function checkPublicEnrollmentRateLimit(ip: string) {
  return hit("app_check_public_enrollment_rate_limit", ip);
}
