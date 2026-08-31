import { z } from "zod";

export const MyProfileSchema = z.object({
  full_name: z.string().trim().min(2, { error: "Informe o nome completo." }),
  phone: z.string().trim().optional().nullable(),
  whatsapp: z.string().trim().optional().nullable(),
});

export type MyProfileInput = z.infer<typeof MyProfileSchema>;
