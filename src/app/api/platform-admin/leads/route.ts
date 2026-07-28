import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/http/api-error";
import { requireAuthContext, requirePermission } from "@/lib/auth/require-permission";
import { leadService, listLeadsQuerySchema, LEADS_PERMISSIONS } from "@/modules/leads";

export async function GET(request: Request) {
  try {
    const ctx = await requireAuthContext("platform-admin");
    await requirePermission(ctx, LEADS_PERMISSIONS.VIEW, request);

    const { searchParams } = new URL(request.url);
    const query = listLeadsQuerySchema.parse({
      status: searchParams.get("status") ?? undefined,
      source: searchParams.get("source") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      pageSize: searchParams.get("pageSize") ?? undefined,
    });

    const result = await leadService.listLeads(query);
    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
