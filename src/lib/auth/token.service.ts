import { SignJWT, jwtVerify, type JWTPayload } from "jose";

// Edge-safe: solo `jose` + Web Crypto global (`crypto.randomUUID`). Este módulo se
// importa desde `src/middleware.ts`, que corre en el Edge runtime — nunca añadir
// aquí un `import ... from "node:crypto"` u otra API exclusiva de Node.
// La generación/hash de refresh tokens (que sí usa `node:crypto`) vive en
// `./refresh-token.util.ts`, importado únicamente por código server-only (Node runtime).

const encoder = new TextEncoder();

function getAccessSecret() {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) throw new Error("JWT_ACCESS_SECRET no está configurado.");
  return encoder.encode(secret);
}

// Datos propios del claim, SIN extender JWTPayload: JWTPayload trae un índice
// `[propName: string]: unknown` que, si se usa como base de un `Omit`/`Pick`,
// colapsa el tipo de todas las propiedades a `unknown` (limitación conocida de TS
// con tipos mapeados sobre interfaces indexadas). Por eso esta interfaz vive
// independiente y solo se combina con JWTPayload al momento de firmar/verificar.
export interface AccessTokenClaimsData {
  sub: string;
  tenantId: string | null;
  tenantCode: string | null;
  branchId: string | null;
  username: string;
  roles: string[];
  permissions: string[];
  isSuperAdmin: boolean;
  isSupportAccount: boolean;
  mustChangePassword: boolean;
}

export type AccessTokenClaims = AccessTokenClaimsData & JWTPayload & { type: "access" };

// Leídos en cada llamada (no cacheados a nivel de módulo) para que el TTL sea
// reconfigurable en runtime y determinista en pruebas.
function getAccessTtlSeconds() {
  return Number(process.env.JWT_ACCESS_TTL_SECONDS ?? 900);
}

function getRefreshTtlSeconds() {
  return Number(process.env.JWT_REFRESH_TTL_SECONDS ?? 1_209_600);
}

export async function signAccessToken(claims: AccessTokenClaimsData) {
  return new SignJWT({ ...claims, type: "access" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setJti(crypto.randomUUID())
    .setExpirationTime(`${getAccessTtlSeconds()}s`)
    .sign(getAccessSecret());
}

export async function verifyAccessToken(token: string): Promise<AccessTokenClaims | null> {
  try {
    const { payload } = await jwtVerify(token, getAccessSecret());
    if (payload.type !== "access") return null;
    return payload as AccessTokenClaims;
  } catch {
    return null;
  }
}

export function accessTokenMaxAgeSeconds() {
  return getAccessTtlSeconds();
}

export function refreshTokenMaxAgeSeconds() {
  return getRefreshTtlSeconds();
}

export function refreshTokenExpiresAt(): Date {
  return new Date(Date.now() + getRefreshTtlSeconds() * 1000);
}
