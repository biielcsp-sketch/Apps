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
