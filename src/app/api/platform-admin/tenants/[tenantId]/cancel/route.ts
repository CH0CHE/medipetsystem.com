import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/http/api-error";
import { requireAuthContext, requirePermission } from "@/lib/auth/require-permission";
import { tenantService, PLATFORM_ADMIN_PERMISSIONS } from "@/modules/platform-admin";

export async function POST(request: Request, { params }: { params: Promise<{ tenantId: string }> }) {
  try {
    const ctx = await requireAuthContext("platform-admin");
    await requirePermission(ctx, PLATFORM_ADMIN_PERMISSIONS.TENANTS_CANCEL, request);

    const { tenantId } = await params;
    await tenantService.cancelTenant(tenantId, ctx.userId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
