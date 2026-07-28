import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/http/api-error";
import { requireAuthContext, requirePermission } from "@/lib/auth/require-permission";
import { plansService, CONTENT_PERMISSIONS } from "@/modules/content";

export async function GET(request: Request) {
  try {
    const ctx = await requireAuthContext("platform-admin");
    await requirePermission(ctx, CONTENT_PERMISSIONS.PLANS_UPDATE, request);

    const plans = await plansService.listPlans();
    return NextResponse.json({ plans });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
