import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/http/api-error";
import { requireAuthContext, requirePermission } from "@/lib/auth/require-permission";
import { auditService, listAuditLogsQuerySchema, PLATFORM_ADMIN_PERMISSIONS } from "@/modules/platform-admin";

export async function GET(request: Request) {
  try {
    const ctx = await requireAuthContext("platform-admin");
    await requirePermission(ctx, PLATFORM_ADMIN_PERMISSIONS.AUDIT_VIEW, request);

    const { searchParams } = new URL(request.url);
    const query = listAuditLogsQuerySchema.parse({
      tenantId: searchParams.get("tenantId") ?? undefined,
      action: searchParams.get("action") ?? undefined,
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      pageSize: searchParams.get("pageSize") ?? undefined,
    });

    const result = await auditService.listAuditLogs(query);
    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
