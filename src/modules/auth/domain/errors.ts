export class InvalidCredentialsError extends Error {
  constructor() {
    super("Usuario o contraseña incorrectos.");
    this.name = "InvalidCredentialsError";
  }
}

export class AccountLockedError extends Error {
  constructor(public lockedUntil: Date) {
    super("Esta cuenta está bloqueada temporalmente por múltiples intentos fallidos.");
    this.name = "AccountLockedError";
  }
}

export class AccountDisabledError extends Error {
  constructor() {
    super("Esta cuenta está deshabilitada.");
    this.name = "AccountDisabledError";
  }
}

export class TenantSuspendedError extends Error {
  constructor() {
    super("La cuenta de tu clínica se encuentra suspendida. Contacta a soporte.");
    this.name = "TenantSuspendedError";
  }
}

export class TenantCancelledError extends Error {
  constructor() {
    super("Esta clínica ha sido dada de baja. Contacta a MediPet System.");
    this.name = "TenantCancelledError";
  }
}

export class WrongPortalError extends Error {
  constructor() {
    super("Este usuario no tiene acceso a este portal.");
    this.name = "WrongPortalError";
  }
}

export class RateLimitedError extends Error {
  constructor() {
    super("Demasiados intentos. Intenta de nuevo más tarde.");
    this.name = "RateLimitedError";
  }
}

export class TokenReuseDetectedError extends Error {
  constructor() {
    super("Se detectó actividad sospechosa en la sesión. Vuelve a iniciar sesión.");
    this.name = "TokenReuseDetectedError";
  }
}

export class InvalidRefreshTokenError extends Error {
  constructor() {
    super("Sesión inválida o expirada.");
    this.name = "InvalidRefreshTokenError";
  }
}
