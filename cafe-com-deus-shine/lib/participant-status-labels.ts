import type { Enums } from "@/types/database.types";

export const PARTICIPANT_STATUS_LABELS: Record<Enums<"participant_status">, string> = {
  nova_inscricao: "Nova inscrição",
  aguardando_distribuicao: "Aguardando distribuição",
  distribuida: "Distribuída",
  ativa: "Ativa",
  acompanhamento: "Acompanhamento",
  inativa: "Inativa",
};

export const PARTICIPANT_STATUS_BADGE: Record<Enums<"participant_status">, string> = {
  nova_inscricao: "bg-muted text-foreground",
  aguardando_distribuicao: "bg-accent/30 text-foreground",
  distribuida: "bg-accent/50 text-foreground",
  ativa: "bg-primary/15 text-primary",
  acompanhamento: "bg-danger/15 text-danger",
  inativa: "bg-muted text-muted-foreground",
};

// Trilha de acompanhamento da participante: da entrada em processo até
// se tornar membro. Diferente do status de distribuição acima (que é sobre
// estar ou não em um café) e do log livre de follow_ups.
export const CONTACT_STATUS_ORDER: Enums<"contact_status">[] = [
  "em_processo",
  "primeira_visita",
  "segunda_visita",
  "terceira_visita",
  "membro",
];

export const CONTACT_STATUS_LABELS: Record<Enums<"contact_status">, string> = {
  em_processo: "Em processo",
  primeira_visita: "1ª visita",
  segunda_visita: "2ª visita",
  terceira_visita: "3ª visita",
  membro: "Membro",
};

export const CONTACT_STATUS_BADGE: Record<Enums<"contact_status">, string> = {
  em_processo: "bg-muted text-foreground",
  primeira_visita: "bg-accent/30 text-foreground",
  segunda_visita: "bg-accent/50 text-foreground",
  terceira_visita: "bg-primary/15 text-primary",
  membro: "bg-primary/20 text-primary",
};
