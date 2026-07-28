import argon2 from "argon2";
import crypto from "node:crypto";

const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19456, // ~19 MB, OWASP-recommended floor for argon2id
  timeCost: 2,
  parallelism: 1,
};

export interface HashedPassword {
  hash: string;
  salt: string;
}

/** Genera un salt único de 16 bytes y produce un hash Argon2id a partir de él. */
export async function hashPassword(plainPassword: string): Promise<HashedPassword> {
  const salt = crypto.randomBytes(16);
  const hash = await argon2.hash(plainPassword, { ...ARGON2_OPTIONS, salt });
  return { hash, salt: salt.toString("base64") };
}

/** El salt viaja embebido en el hash codificado de Argon2; solo se necesita el hash para verificar. */
export async function verifyPassword(hash: string, plainPassword: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plainPassword);
  } catch {
    return false;
  }
}

const TEMP_PASSWORD_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";

/** Genera una contraseña temporal legible que cumple la política de complejidad. */
export function generateTemporaryPassword(length = 14): string {
  const bytes = crypto.randomBytes(length);
  let password = "";
  for (let i = 0; i < length; i++) {
    password += TEMP_PASSWORD_ALPHABET[bytes[i]! % TEMP_PASSWORD_ALPHABET.length];
  }
  // Garantiza al menos un carácter de cada clase exigida por la política.
  return `${password}A1!`;
}
