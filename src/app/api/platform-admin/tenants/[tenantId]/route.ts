import { NextResponse } from "next/server";
import { apiErrorResponse, ApiError } from "@/lib/http/api-error";
import { requireAuthContext, requirePermission } from "@/lib/auth/require-permission";
import { tenantService, PLATFORM_ADMIN_PERMISSIONS } from "@/modules/platform-admin";

export async function GET(request: Request, { params }: { params: Promise<{ tenantId: string }> }) {
  try {
    const ctx = await requireAuthContext("platform-admin");
    await requirePermission(ctx, PLATFORM_ADMIN_PERMISSIONS.TENANTS_VIEW, request);

    const { tenantId } = await params;
    const tenant = await tenantService.getTenantDetail(tenantId);
    if (!tenant) throw new ApiError(404, "Clínica no encontrada.", "NOT_FOUND");

    return NextResponse.json({ tenant });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
