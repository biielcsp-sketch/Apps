import "server-only";

/**
 * Erro cuja `message` já é redigida para a usuária final (validação de
 * regra de negócio, ex.: "e-mail já cadastrado"). Nunca lance uma AppError
 * a partir de `error.message` do Supabase/Postgres — isso reintroduziria o
 * vazamento que este arquivo existe para evitar.
 */
export class AppError extends Error {}

/**
 * Ponto único por onde todo erro vindo de uma chamada ao Supabase/Postgres
 * deve passar. Loga o erro real e completo no servidor (nunca escondido de
 * quem desenvolve, só de quem usa a tela) e lança uma AppError com mensagem
 * genérica seguro para a UI — detalhe de constraint, coluna ou query nunca
 * chega ao client.
 */
export function dbError(
  error: unknown,
  context: string,
  fallback = "Não foi possível completar a operação. Tente novamente.",
): never {
  console.error(`[db:${context}]`, error);
  throw new AppError(fallback);
}

/**
 * Usado pelas Server Actions ao converter uma exceção de service em
 * mensagem de UI: preserva a mensagem só quando é uma AppError (deliberada
 * e já segura); qualquer outra coisa é um erro não classificado — loga o
 * real no servidor e devolve mensagem genérica, nunca repassa `e.message`
 * cru.
 */
export function toUserMessage(
  e: unknown,
  context: string,
  fallback = "Ocorreu um erro. Tente novamente.",
): string {
  if (e instanceof AppError) return e.message;
  console.error(`[action:${context}]`, e);
  return fallback;
}
