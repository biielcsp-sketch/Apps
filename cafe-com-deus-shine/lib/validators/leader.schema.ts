import { z } from "zod";

export const LeaderCreateSchema = z.object({
  full_name: z.string().trim().min(2, { error: "Informe o nome completo." }),
  email: z.email({ error: "Informe um e-mail válido." }),
  phone: z.string().trim().optional().nullable(),
  whatsapp: z.string().trim().optional().nullable(),
  city: z.string().trim().optional().nullable(),
  neighborhood: z.string().trim().optional().nullable(),
  meeting_address: z.string().trim().optional().nullable(),
  region: z.string().trim().optional().nullable(),
  max_capacity: z.coerce.number().int().positive({ error: "A capacidade deve ser maior que zero." }),
  // Co-líder tem a mesma função da líder — muda só como ela é chamada.
  role: z.enum(["lider", "co_lider"]).optional(),
});
export type LeaderCreateInput = z.infer<typeof LeaderCreateSchema>;

export const LeaderUpdateSchema = z.object({
  city: z.string().trim().optional().nullable(),
  neighborhood: z.string().trim().optional().nullable(),
  meeting_address: z.string().trim().optional().nullable(),
  region: z.string().trim().optional().nullable(),
  max_capacity: z.coerce.number().int().positive({ error: "A capacidade deve ser maior que zero." }),
  admin_notes: z.string().trim().optional().nullable(),
});
export type LeaderUpdateInput = z.infer<typeof LeaderUpdateSchema>;

export const GroupSchema = z.object({
  name: z.string().trim().min(2, { error: "Informe o nome do grupo." }),
  leader_id: z.string().uuid({ error: "Selecione a líder responsável." }),
  address: z.string().trim().optional().nullable(),
  capacity: z.coerce.number().int().positive({ error: "A capacidade deve ser maior que zero." }),
  region: z.string().trim().optional().nullable(),
  available_days: z.array(z.string()).optional().nullable(),
  meeting_time: z.string().optional().nullable(),
  host_profile_id: z.string().uuid().optional().nullable(),
  status: z.enum(["ativo", "inativo", "lotado"]).optional(),
});
export type GroupInput = z.infer<typeof GroupSchema>;
