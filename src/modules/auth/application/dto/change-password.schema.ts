import { z } from "zod";
import { buildPasswordSchema, DEFAULT_PASSWORD_POLICY, type PasswordPolicy } from "@/lib/security/password-policy";

export function buildChangePasswordSchema(policy: PasswordPolicy = DEFAULT_PASSWORD_POLICY) {
  return z
    .object({
      currentPassword: z.string().min(1, "Ingresa tu contraseña actual."),
      newPassword: buildPasswordSchema(policy),
      confirmPassword: z.string().min(1, "Confirma tu nueva contraseña."),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: "Las contraseñas no coinciden.",
      path: ["confirmPassword"],
    })
    .refine((data) => data.newPassword !== data.currentPassword, {
      message: "La nueva contraseña debe ser diferente a la actual.",
      path: ["newPassword"],
    });
}

export const changePasswordSchema = buildChangePasswordSchema(DEFAULT_PASSWORD_POLICY);

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
