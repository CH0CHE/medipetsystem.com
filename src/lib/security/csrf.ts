// Edge-safe: usa únicamente Web Crypto (`crypto.getRandomValues`, `btoa`), nunca
// `node:crypto` — este módulo se importa desde `src/middleware.ts` (Edge runtime).

export const CSRF_COOKIE_NAME = "mp_csrf_token";
export const CSRF_HEADER_NAME = "x-csrf-token";

export function generateCsrfToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Comparación en tiempo aproximadamente constante para evitar timing attacks triviales. */
export function csrfTokensMatch(cookieToken: string | undefined, headerToken: string | undefined): boolean {
  if (!cookieToken || !headerToken) return false;
  if (cookieToken.length !== headerToken.length) return false;

  let mismatch = 0;
  for (let i = 0; i < cookieToken.length; i++) {
    mismatch |= cookieToken.charCodeAt(i) ^ headerToken.charCodeAt(i);
  }
  return mismatch === 0;
}

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function requiresCsrfCheck(method: string): boolean {
  return MUTATING_METHODS.has(method.toUpperCase());
}
