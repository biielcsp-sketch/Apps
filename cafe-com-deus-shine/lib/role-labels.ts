import type { Enums } from "@/types/database.types";

// Ponto único de verdade dos rótulos de papel — antes cada tela tinha a
// própria cópia deste mapa, o que fez os três lugares quebrarem juntos ao
// entrar um papel novo no enum.
export const ROLE_LABELS: Record<Enums<"user_role">, string> = {
  admin: "Admin",
  desenvolvedor: "Desenvolvedor",
  lider: "Líder",
  co_lider: "Co-líder",
  anfitria: "Anfitriã",
  participante: "Participante",
};

export const ROLE_ORDER: Enums<"user_role">[] = [
  "desenvolvedor",
  "admin",
  "lider",
  "co_lider",
  "anfitria",
  "participante",
];

// Co-líder tem exatamente a mesma função da líder — muda só o nome. Toda
// checagem de "é liderança?" no app passa por aqui, nunca compara com
// "lider" direto, senão a co-líder fica de fora sem querer.
export function isLeaderRole(role: Enums<"user_role"> | undefined | null) {
  return role === "lider" || role === "co_lider";
}

// Anfitriã: enxerga o café que hospeda como a líder enxerga (somente
// leitura) e também tem o próprio cadastro de participante.
export function isHostRole(role: Enums<"user_role"> | undefined | null) {
  return role === "anfitria";
}
