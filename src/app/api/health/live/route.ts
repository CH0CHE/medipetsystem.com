import { NextResponse } from "next/server";

/**
 * Liveness probe: solo confirma que el proceso puede ejecutar JS, sin
 * dependencias externas (a diferencia de `/api/health`, que sí valida la
 * base de datos). Un orquestador (Kubernetes) no debería reiniciar el pod
 * solo porque Postgres esté momentáneamente lento o inaccesible.
 */
export async function GET() {
  return NextResponse.json({ status: "ok" });
}
