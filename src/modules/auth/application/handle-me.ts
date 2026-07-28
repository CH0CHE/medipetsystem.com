import { NextResponse } from "next/server";
import { ApiError } from "@/lib/http/api-error";
import { getServerAuthContext } from "@/lib/auth/server-session";
import type { SessionNamespace } from "@/lib/auth/cookies";
import { authService } from "../index";

export async function handleMeRequest(namespace: SessionNamespace): Promise<NextResponse> {
  const ctx = await getServerAuthContext(namespace);
  if (!ctx) {
    throw new ApiError(401, "No autenticado.", "UNAUTHENTICATED");
  }

  const session = await authService.getSessionContext(ctx.userId);
  if (!session || session.userStatus !== "ACTIVE") {
    throw new ApiError(401, "Sesión inválida.", "UNAUTHENTICATED");
  }

  return NextResponse.json({ user: session });
}
