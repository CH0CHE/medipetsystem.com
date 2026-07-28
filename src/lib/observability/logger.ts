/**
 * Logger estructurado mínimo (sin dependencia externa) — emite una línea JSON
 * por evento vía `console.*`, apto para Edge runtime (usado también desde
 * `middleware.ts`). El nivel `error` es el punto de integración natural para
 * un proveedor externo (Sentry/Datadog/etc.) si el proyecto lo adopta más
 * adelante; hoy solo se registra en stdout/stderr.
 */
export type LogLevel = "info" | "warn" | "error";

export interface LogContext {
  [key: string]: unknown;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  [key: string]: unknown;
}

function write(level: LogLevel, message: string, context?: LogContext): void {
  const entry: LogEntry = { level, message, timestamp: new Date().toISOString(), ...context };
  const line = JSON.stringify(entry);

  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export function logInfo(message: string, context?: LogContext): void {
  write("info", message, context);
}

export function logWarn(message: string, context?: LogContext): void {
  write("warn", message, context);
}

export function logError(message: string, context?: LogContext): void {
  write("error", message, context);
}
