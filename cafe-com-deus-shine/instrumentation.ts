// Hook oficial do Next.js: `register()` roda uma única vez quando o
// processo do servidor inicia, antes de qualquer requisição ser atendida.
// S7 usa isto para forçar a validação de variáveis de ambiente
// (lib/env.ts) no boot, em vez de deixar a app subir "quebrada pela
// metade" e só falhar quando alguma rota específica tentar usar a
// variável ausente pela primeira vez.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("@/lib/env");
  }
}
