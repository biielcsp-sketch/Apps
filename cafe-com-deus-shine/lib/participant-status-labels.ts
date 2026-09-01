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

// Trilha de acompanhamento de contato (tentativas de mensagem/ligação até
// consolidar) — diferente do status de distribuição acima e do log livre
// de follow_ups.
export const CONTACT_STATUS_ORDER: Enums<"contact_status">[] = [
  "aguardando_1_contato",
  "primeira_mensagem_enviada",
  "segunda_mensagem_enviada",
  "em_conversa",
  "em_processo",
  "nao_respondeu",
  "parou_de_responder",
  "numero_invalido",
  "consolidada",
  "sem_interesse",
];

export const CONTACT_STATUS_LABELS: Record<Enums<"contact_status">, string> = {
  aguardando_1_contato: "Aguardando 1º contato",
  primeira_mensagem_enviada: "1ª Mensagem enviada",
  segunda_mensagem_enviada: "2ª Mensagem enviada",
  em_conversa: "Em conversa",
  em_processo: "Em Processo",
  nao_respondeu: "Não respondeu",
  parou_de_responder: "Parou de responder",
  numero_invalido: "Número inválido",
  consolidada: "Consolidada",
  sem_interesse: "Sem Interesse",
};

export const CONTACT_STATUS_BADGE: Record<Enums<"contact_status">, string> = {
  aguardando_1_contato: "bg-muted text-foreground",
  primeira_mensagem_enviada: "bg-accent/30 text-foreground",
  segunda_mensagem_enviada: "bg-primary/15 text-primary",
  em_conversa: "bg-primary/15 text-primary",
  em_processo: "bg-accent/40 text-foreground",
  nao_respondeu: "bg-muted text-muted-foreground",
  parou_de_responder: "bg-danger/15 text-danger",
  numero_invalido: "bg-danger/15 text-danger",
  consolidada: "bg-primary/20 text-primary",
  sem_interesse: "bg-muted text-muted-foreground",
};
