import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Las stored procedures señalan condiciones de negocio con `RAISE EXCEPTION ...
 * USING ERRCODE = '...'`: 'P0002' = no encontrado/sin acceso, 'P0001' = conflicto
 * de negocio (SKU duplicado, existencia insuficiente, cantidad inválida, etc.).
 * Prisma envuelve cualquier excepción de una raw query como
 * PrismaClientKnownRequestError(P2010), con el SQLSTATE real y el mensaje de la
 * excepción en `meta`. Este helper los traduce a una respuesta limpia en vez de
 * un 500 genérico, para cualquier módulo que use el mismo patrón de SP.
 */
function mapStoredProcedureError(error: unknown): ApiError | null {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return null;
  if (error.code !== "P2010") return null;
  const meta = error.meta as { code?: string; message?: string } | undefined;
  if (meta?.code === "P0002") return new ApiError(404, meta.message ?? "No encontrado.", "NOT_FOUND");
  if (meta?.code === "P0001") return new ApiError(409, meta.message ?? "Conflicto de negocio.", "BUSINESS_CONFLICT");
  return null;
}

export function apiErrorResponse(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
  }
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "Datos inválidos.", code: "VALIDATION_ERROR", issues: error.flatten() },
      { status: 400 },
    );
  }
  const spError = mapStoredProcedureError(error);
  if (spError) {
    return NextResponse.json({ error: spError.message, code: spError.code }, { status: spError.status });
  }
  console.error("Unhandled API error:", error);
  return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 });
}

export function getRequestIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

export function getRequestUserAgent(request: Request): string {
  return request.headers.get("user-agent") ?? "unknown";
}
