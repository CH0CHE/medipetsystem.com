import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from "@/lib/security/csrf";

export class ApiClientError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]!) : undefined;
}

async function ensureCsrfToken(): Promise<string | undefined> {
  const existing = readCookie(CSRF_COOKIE_NAME);
  if (existing) return existing;
  await fetch("/api/auth/csrf", { credentials: "include" });
  return readCookie(CSRF_COOKIE_NAME);
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  refreshPath?: string;
  /** Los propios endpoints de auth (login/csrf/refresh) nunca disparan el auto-refresh. */
  skipAuthRetry?: boolean;
}

/**
 * Wrapper de fetch con: cookies de sesión, header CSRF de doble-submit en mutaciones,
 * y un único reintento automático a través del endpoint de refresh cuando el access
 * token expiró (401). Si el refresh también falla, propaga el error para que la UI
 * redirija a login.
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, refreshPath = "/api/auth/refresh", skipAuthRetry = false } = options;

  const doFetch = async (): Promise<Response> => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (method !== "GET") {
      const csrfToken = await ensureCsrfToken();
      if (csrfToken) headers[CSRF_HEADER_NAME] = csrfToken;
    }
    return fetch(path, {
      method,
      headers,
      credentials: "include",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  };

  let response = await doFetch();

  if (response.status === 401 && !skipAuthRetry) {
    const refreshRes = await fetch(refreshPath, { method: "POST", credentials: "include" });
    if (refreshRes.ok) {
      response = await doFetch();
    }
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({ error: "Error de red." }));
    throw new ApiClientError(response.status, data.error ?? "Ocurrió un error.", data.code);
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}
