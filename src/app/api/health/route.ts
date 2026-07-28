import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

/**
 * Readiness probe: además de que el proceso responda, confirma que puede
 * hablar con la base de datos. Para el liveness probe (¿el proceso sigue
 * vivo, sin depender de nada externo?) usa `/api/health/live`.
 */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok" });
  } catch {
    return NextResponse.json({ status: "error" }, { status: 503 });
  }
}
