import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/http/api-error";
import { requireAuthContext, requirePermission } from "@/lib/auth/require-permission";
import { tenantService, suspendTenantSchema, PLATFORM_ADMIN_PERMISSIONS } from "@/modules/platform-admin";

export async function POST(request: Request, { params }: { params: Promise<{ tenantId: string }> }) {
  try {
    const ctx = await requireAuthContext("platform-admin");
    await requirePermission(ctx, PLATFORM_ADMIN_PERMISSIONS.TENANTS_SUSPEND, request);

    const { tenantId } = await params;
    const body = await request.json();
    const input = suspendTenantSchema.parse(body);

    await tenantService.suspendTenant(tenantId, ctx.userId, input.reason);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
