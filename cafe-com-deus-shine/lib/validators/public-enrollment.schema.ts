import { z } from "zod";
import { AVAILABILITY_DAYS, AVAILABILITY_PERIODS } from "@/lib/validators/participant.schema";

// Schema PRÓPRIO do cadastro público (Fase 9) — nunca reaproveita o schema
// administrativo de participante. status, current_leader_id, admin_notes e
// qualquer outro campo interno nunca vêm daqui — são decididos no servidor
// em public-enrollment.service.ts.
// Nome e telefone sempre obrigatórios; endereço, disponibilidade (dias e
// período) e preferência de localização também são obrigatórios a pedido
// do usuário — só cidade, bairro e e-mail continuam opcionais.
export const PublicEnrollmentSchema = z.object({
  full_name: z.string().trim().min(2, { error: "Informe seu nome completo." }),
  phone: z.string().trim().min(8, { error: "Informe um telefone válido, com DDD." }),
  whatsapp: z.string().trim().optional(),
  email: z.union([z.email({ error: "E-mail inválido." }), z.literal("")]).optional(),
  birth_date: z.string().optional(),
  city: z.string().trim().optional(),
  neighborhood: z.string().trim().optional(),
  address: z.string().trim().min(1, { error: "Informe seu endereço." }),
  availability_days: z
    .array(z.enum(AVAILABILITY_DAYS))
    .min(1, { error: "Selecione ao menos um dia disponível." }),
  availability_period: z
    .array(z.enum(AVAILABILITY_PERIODS))
    .min(1, { error: "Selecione ao menos um período disponível." }),
  location_preference: z.string().trim().min(1, { error: "Informe sua preferência de localização." }),
  consent_accepted: z.literal(true, {
    error: "É necessário aceitar os termos para se inscrever.",
  }),
  code: z.string().trim().min(1, { error: "Link de inscrição inválido." }),
  // Honeypot (Q2 desenha o campo escondido na tela): humano nunca preenche.
  // Se vier com valor, o service descarta a inscrição silenciosamente.
  website: z.string().optional(),
});
export type PublicEnrollmentInput = z.infer<typeof PublicEnrollmentSchema>;
