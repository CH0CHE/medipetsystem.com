import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/http/api-error";
import { requireAuthContext, requirePermission } from "@/lib/auth/require-permission";
import { tenantService, updatePlanSchema, PLATFORM_ADMIN_PERMISSIONS } from "@/modules/platform-admin";

export async function PATCH(request: Request, { params }: { params: Promise<{ tenantId: string }> }) {
  try {
    const ctx = await requireAuthContext("platform-admin");
    await requirePermission(ctx, PLATFORM_ADMIN_PERMISSIONS.PLANS_UPDATE, request);

    const { tenantId } = await params;
    const body = await request.json();
    const input = updatePlanSchema.parse(body);

    await tenantService.updateTenantPlan(tenantId, input.plan, ctx.userId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
