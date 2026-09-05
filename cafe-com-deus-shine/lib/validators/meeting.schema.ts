import { z } from "zod";

export const MeetingSchema = z.object({
  title: z.string().trim().min(2, { error: "Informe um título." }),
  group_id: z.string().uuid({ error: "Selecione o grupo." }),
  date: z.string().min(1, { error: "Informe a data." }),
  time: z.string().optional().nullable(),
  location: z.string().trim().optional().nullable(),
  ministered_by: z.string().trim().optional().nullable(),
  status: z.enum(["planejado", "confirmado", "realizado", "cancelado"]).optional(),
});
export type MeetingInput = z.infer<typeof MeetingSchema>;
