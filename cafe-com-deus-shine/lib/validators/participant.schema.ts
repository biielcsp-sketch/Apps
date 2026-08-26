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

export const CONSENT_METHODS = [
  "formulario_presencial",
  "autocadastro",
  "termo_assinado",
] as const;

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

// Campos administrativos — só admin pode enviar/alterar.
export const ParticipantAdminSchema = z.object({
  admin_notes: z.string().trim().optional().nullable(),
  enrollment_source: z.string().trim().optional().nullable(),
  current_leader_id: z.string().uuid().optional().nullable(),
});
export type ParticipantAdminInput = z.infer<typeof ParticipantAdminSchema>;

export const ConsentSchema = z.object({
  consent_accepted: z.literal(true, {
    error: "É necessário aceitar o termo para cadastrar a participante.",
  }),
  consent_method: z.enum(CONSENT_METHODS, { error: "Selecione como o consentimento foi obtido." }),
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

export const CONSENT_METHOD_LABELS: Record<(typeof CONSENT_METHODS)[number], string> = {
  formulario_presencial: "Formulário presencial",
  autocadastro: "Autocadastro",
  termo_assinado: "Termo assinado",
};
