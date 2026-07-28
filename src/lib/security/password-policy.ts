import { z } from "zod";

export interface PasswordPolicy {
  minLength: number;
  maxLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumber: boolean;
  requireSymbol: boolean;
}

/**
 * Política de complejidad de contraseñas. Este es el default de la
 * aplicación; cada tenant puede sobreescribir parcialmente estos valores
 * (`Tenant.passwordPolicy`, ver `src/modules/settings`) — `NULL` en esa
 * columna significa "usa este default tal cual".
 */
export const DEFAULT_PASSWORD_POLICY: PasswordPolicy = {
  minLength: 10,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSymbol: true,
};

/** @deprecated usa `DEFAULT_PASSWORD_POLICY` o la política efectiva del tenant. */
export const PASSWORD_POLICY = DEFAULT_PASSWORD_POLICY;

export function resolvePasswordPolicy(override: Partial<PasswordPolicy> | null | undefined): PasswordPolicy {
  return { ...DEFAULT_PASSWORD_POLICY, ...(override ?? {}) };
}

export function buildPasswordSchema(policy: PasswordPolicy = DEFAULT_PASSWORD_POLICY) {
  return z
    .string()
    .min(policy.minLength, `La contraseña debe tener al menos ${policy.minLength} caracteres.`)
    .max(policy.maxLength, "La contraseña es demasiado larga.")
    .refine((v) => !policy.requireUppercase || /[A-Z]/.test(v), "Debe incluir al menos una mayúscula.")
    .refine((v) => !policy.requireLowercase || /[a-z]/.test(v), "Debe incluir al menos una minúscula.")
    .refine((v) => !policy.requireNumber || /[0-9]/.test(v), "Debe incluir al menos un número.")
    .refine((v) => !policy.requireSymbol || /[^A-Za-z0-9]/.test(v), "Debe incluir al menos un símbolo especial.");
}

export const passwordSchema = buildPasswordSchema(DEFAULT_PASSWORD_POLICY);
