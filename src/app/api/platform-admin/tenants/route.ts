import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/http/api-error";
import { requireAuthContext, requirePermission } from "@/lib/auth/require-permission";
import { tenantService, createTenantSchema, listTenantsQuerySchema, PLATFORM_ADMIN_PERMISSIONS } from "@/modules/platform-admin";

export async function GET(request: Request) {
  try {
    const ctx = await requireAuthContext("platform-admin");
    await requirePermission(ctx, PLATFORM_ADMIN_PERMISSIONS.TENANTS_VIEW, request);

    const { searchParams } = new URL(request.url);
    const query = listTenantsQuerySchema.parse({
      search: searchParams.get("search") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      pageSize: searchParams.get("pageSize") ?? undefined,
    });

    const result = await tenantService.listTenants(query);
    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await requireAuthContext("platform-admin");
    await requirePermission(ctx, PLATFORM_ADMIN_PERMISSIONS.TENANTS_CREATE, request);

    const body = await request.json();
    const input = createTenantSchema.parse(body);

    const result = await tenantService.createTenant(input, ctx.userId);
    return NextResponse.json({ tenant: result }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
