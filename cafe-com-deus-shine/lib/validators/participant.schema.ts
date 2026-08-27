import { z } from "zod";

export const AVAILABILITY_DAYS = [
  "segunda",
  "terca",
  "quarta",
  "quinta",
  "sexta",
  "sabado",
  "domingo",
] as const;

export const AVAILABILITY_PERIODS = ["manha", "tarde", "noite"] as const;

// Campos que tanto admin quanto líder (dentro do seu vínculo) podem editar.
export const ParticipantPersonalSchema = z.object({
  full_name: z.string().trim().min(2, { error: "Informe o nome completo." }),
  preferred_name: z.string().trim().optional().nullable(),
  phone: z.string().trim().optional().nullable(),
  whatsapp: z.string().trim().optional().nullable(),
  email: z.union([z.email({ error: "E-mail inválido." }), z.literal("")]).optional().nullable(),
  birth_date: z.string().optional().nullable(),
  city: z.string().trim().optional().nullable(),
  neighborhood: z.string().trim().optional().nullable(),
  address: z.string().trim().optional().nullable(),
  availability_days: z.array(z.enum(AVAILABILITY_DAYS)).optional().nullable(),
  availability_period: z.array(z.enum(AVAILABILITY_PERIODS)).optional().nullable(),
  location_preference: z.string().trim().optional().nullable(),
  home_meeting_ok: z.boolean().optional(),
  other_notes: z.string().trim().optional().nullable(),
});
export type ParticipantPersonalInput = z.infer<typeof ParticipantPersonalSchema>;

// Campos que a própria participante pode alterar no seu autoatendimento.
// Reforçado pelo trigger guard_participant_self_update no banco — este
// schema é só a camada de validação/UX, não a barreira de segurança.
export const ParticipantSelfEditSchema = z.object({
  phone: z.string().trim().optional().nullable(),
  whatsapp: z.string().trim().optional().nullable(),
  address: z.string().trim().optional().nullable(),
  availability_days: z.array(z.enum(AVAILABILITY_DAYS)).optional().nullable(),
  availability_period: z.array(z.enum(AVAILABILITY_PERIODS)).optional().nullable(),
  location_preference: z.string().trim().optional().nullable(),
  home_meeting_ok: z.boolean().optional(),
});
export type ParticipantSelfEditInput = z.infer<typeof ParticipantSelfEditSchema>;

// Campos administrativos — só admin pode enviar/alterar.
export const ParticipantAdminSchema = z.object({
  admin_notes: z.string().trim().optional().nullable(),
  enrollment_source: z.string().trim().optional().nullable(),
  current_leader_id: z.string().uuid().optional().nullable(),
});
export type ParticipantAdminInput = z.infer<typeof ParticipantAdminSchema>;

export const ConsentSchema = z.object({
  consent_accepted: z.literal(true, {
    error: "É necessário marcar que a participante concordou em ser contatada.",
  }),
});
export type ConsentInput = z.infer<typeof ConsentSchema>;

export const ParticipantCreateSchema = ParticipantPersonalSchema.extend(
  ParticipantAdminSchema.shape,
).extend(ConsentSchema.shape);
export type ParticipantCreateInput = z.infer<typeof ParticipantCreateSchema>;

export const AVAILABILITY_DAY_LABELS: Record<(typeof AVAILABILITY_DAYS)[number], string> = {
  segunda: "Segunda",
  terca: "Terça",
  quarta: "Quarta",
  quinta: "Quinta",
  sexta: "Sexta",
  sabado: "Sábado",
  domingo: "Domingo",
};

export const AVAILABILITY_PERIOD_LABELS: Record<(typeof AVAILABILITY_PERIODS)[number], string> = {
  manha: "Manhã",
  tarde: "Tarde",
  noite: "Noite",
};
