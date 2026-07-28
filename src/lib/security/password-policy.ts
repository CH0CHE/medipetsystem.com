import { z } from "zod";

/**
 * Política de complejidad de contraseñas. Configurable por ahora vía constantes de
 * código (Fase 1); una versión por-tenant respaldada en DB queda para `modules/settings`.
 */
export const PASSWORD_POLICY = {
  minLength: 10,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSymbol: true,
};

export const passwordSchema = z
  .string()
  .min(PASSWORD_POLICY.minLength, `La contraseña debe tener al menos ${PASSWORD_POLICY.minLength} caracteres.`)
  .max(PASSWORD_POLICY.maxLength, "La contraseña es demasiado larga.")
  .refine((v) => !PASSWORD_POLICY.requireUppercase || /[A-Z]/.test(v), "Debe incluir al menos una mayúscula.")
  .refine((v) => !PASSWORD_POLICY.requireLowercase || /[a-z]/.test(v), "Debe incluir al menos una minúscula.")
  .refine((v) => !PASSWORD_POLICY.requireNumber || /[0-9]/.test(v), "Debe incluir al menos un número.")
  .refine(
    (v) => !PASSWORD_POLICY.requireSymbol || /[^A-Za-z0-9]/.test(v),
    "Debe incluir al menos un símbolo especial.",
  );
