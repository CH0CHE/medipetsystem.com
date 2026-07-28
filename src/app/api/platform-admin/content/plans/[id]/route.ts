import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/http/api-error";
import { requireAuthContext, requirePermission } from "@/lib/auth/require-permission";
import { plansService, updateMarketingPlanSchema, CONTENT_PERMISSIONS } from "@/modules/content";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireAuthContext("platform-admin");
    await requirePermission(ctx, CONTENT_PERMISSIONS.PLANS_UPDATE, request);

    const { id } = await params;
    const body = await request.json();
    const input = updateMarketingPlanSchema.parse(body);

    await plansService.updatePlan(id, input, ctx.userId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
