import { z } from "zod";

export const FOLLOW_UP_TYPES = [
  "encontro",
  "ligacao",
  "whatsapp",
  "visita",
  "oracao",
  "acompanhamento_pastoral",
  "outro",
] as const;

export const FOLLOW_UP_TYPE_LABELS: Record<(typeof FOLLOW_UP_TYPES)[number], string> = {
  encontro: "Encontro",
  ligacao: "Ligação",
  whatsapp: "WhatsApp",
  visita: "Visita",
  oracao: "Oração",
  acompanhamento_pastoral: "Acompanhamento pastoral",
  outro: "Outro",
};

export const FollowUpSchema = z.object({
  date: z.string().min(1, { error: "Informe a data." }),
  type: z.enum(FOLLOW_UP_TYPES, { error: "Selecione o tipo." }),
  status: z.enum(["normal", "atencao", "acompanhamento_necessario"]).optional(),
  observation: z.string().trim().optional().nullable(),
  needs_return: z.boolean().optional(),
  next_follow_up_date: z.string().optional().nullable(),
});
export type FollowUpInput = z.infer<typeof FollowUpSchema>;
