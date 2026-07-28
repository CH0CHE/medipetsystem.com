import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().trim().min(1, "Ingresa tu usuario.").max(100),
  password: z.string().min(1, "Ingresa tu contraseña.").max(256),
  rememberMe: z.boolean().optional().default(false),
});

export type LoginInput = z.infer<typeof loginSchema>;
