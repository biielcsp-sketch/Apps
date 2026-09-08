import "server-only";
import { z } from "zod";

// S7 (validação de variáveis de ambiente no boot): se alguma variável
// obrigatória estiver ausente ou em formato errado, a aplicação falha ao
// subir com uma mensagem clara — nunca sobe "quebrada pela metade" com uma
// feature de segurança silenciosamente desativada por falta de
// configuração. `instrumentation.ts` importa este módulo assim que o
// processo do servidor inicia, forçando o parse abaixo a rodar antes de
// qualquer requisição ser atendida (não só quando a rota que usa a
// variável for chamada pela primeira vez).
const ServerEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url({ error: "precisa ser uma URL válida (ex.: https://xxxx.supabase.co)" }),
  // Esta vai inteira para o JavaScript do navegador (todo NEXT_PUBLIC_ vai).
  // Por isso só pode ser a chave pública: `sb_publishable_...` ou a anon
  // legada (um JWT, que começa com "eyJ"). Já aconteceu de a chave secreta
  // ser colada aqui por engano — e uma chave `sb_secret_` publicada assim
  // ignora toda a RLS para quem abrir o código-fonte da página. Agora a
  // aplicação se recusa a subir nesse estado em vez de servir o buraco.
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, { error: "não pode ficar vazia" })
    .refine((v) => !v.startsWith("sb_secret_"), {
      error:
        "está com a chave SECRETA (sb_secret_...), que vai parar no navegador de quem abrir o site. " +
        "Use a publishable (sb_publishable_...), em Supabase → Project Settings → API Keys",
    }),
  // Chave mestra — ignora RLS. Nunca prefixar com NEXT_PUBLIC_, nunca
  // importar este módulo de um Client Component (o "server-only" acima já
  // impede isso na build).
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, { error: "não pode ficar vazia" }),
});

function loadServerEnv() {
  const result = ServerEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  });

  if (!result.success) {
    const details = result.error.issues.map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`).join("\n");
    throw new Error(
      `Configuração de ambiente inválida — corrija .env.local (ou as variáveis do Netlify) antes de subir a aplicação:\n${details}`,
    );
  }

  // A mesma checagem por outro ângulo: mesmo que um dia a secreta mude de
  // prefixo, ela nunca pode ser igual à chave que vai para o navegador.
  if (
    result.data.NEXT_PUBLIC_SUPABASE_ANON_KEY === result.data.SUPABASE_SERVICE_ROLE_KEY
  ) {
    throw new Error(
      "Configuração de ambiente inválida — NEXT_PUBLIC_SUPABASE_ANON_KEY está com o mesmo " +
        "valor de SUPABASE_SERVICE_ROLE_KEY. A primeira é publicada no navegador; a segunda " +
        "ignora toda a RLS. Troque a NEXT_PUBLIC_ pela chave publishable.",
    );
  }

  return result.data;
}

export const serverEnv = loadServerEnv();
