import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/http/api-error";
import { requireAuthContext, requirePermission } from "@/lib/auth/require-permission";
import { metricsService, PLATFORM_ADMIN_PERMISSIONS } from "@/modules/platform-admin";

export async function GET(request: Request) {
  try {
    const ctx = await requireAuthContext("platform-admin");
    await requirePermission(ctx, PLATFORM_ADMIN_PERMISSIONS.METRICS_VIEW, request);

    const metrics = await metricsService.getSaasMetrics();
    return NextResponse.json(metrics);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
