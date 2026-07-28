import crypto from "node:crypto";

// Node-only. Nunca importar desde `src/middleware.ts` (Edge runtime) — ver nota en
// `./token.service.ts`.

/** Token opaco (no-JWT): el valor crudo solo vive en la cookie httpOnly del cliente. */
export function generateOpaqueRefreshToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

export function hashRefreshToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

export function generateTokenFamily(): string {
  return crypto.randomUUID();
}
