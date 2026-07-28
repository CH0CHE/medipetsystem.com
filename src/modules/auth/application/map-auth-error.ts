import { ApiError } from "@/lib/http/api-error";
import {
  AccountDisabledError,
  AccountLockedError,
  InvalidCredentialsError,
  InvalidRefreshTokenError,
  RateLimitedError,
  TenantCancelledError,
  TenantSuspendedError,
  TokenReuseDetectedError,
  WrongPortalError,
} from "../domain/errors";

/** Traduce errores de dominio de Auth a respuestas HTTP, sin filtrar detalles internos. */
export function mapAuthErrorToApiError(error: unknown): ApiError | null {
  if (error instanceof AccountLockedError) {
    return new ApiError(423, error.message, "ACCOUNT_LOCKED");
  }
  if (error instanceof AccountDisabledError) {
    return new ApiError(403, error.message, "ACCOUNT_DISABLED");
  }
  if (error instanceof TenantSuspendedError) {
    return new ApiError(403, error.message, "TENANT_SUSPENDED");
  }
  if (error instanceof TenantCancelledError) {
    return new ApiError(403, error.message, "TENANT_CANCELLED");
  }
  if (error instanceof WrongPortalError || error instanceof InvalidCredentialsError) {
    return new ApiError(401, error instanceof WrongPortalError ? error.message : "Usuario o contraseña incorrectos.", "INVALID_CREDENTIALS");
  }
  if (error instanceof RateLimitedError) {
    return new ApiError(429, error.message, "RATE_LIMITED");
  }
  if (error instanceof TokenReuseDetectedError) {
    return new ApiError(401, error.message, "TOKEN_REUSE_DETECTED");
  }
  if (error instanceof InvalidRefreshTokenError) {
    return new ApiError(401, error.message, "INVALID_REFRESH_TOKEN");
  }
  return null;
}
