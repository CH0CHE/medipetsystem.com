import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/http/api-error";
import { requireAuthContext, requirePermission } from "@/lib/auth/require-permission";
import { ownerService, createOwnerSchema, listOwnersQuerySchema, OWNER_PERMISSIONS } from "@/modules/owners";

export async function GET(request: Request) {
  try {
    const ctx = await requireAuthContext("tenant");
    await requirePermission(ctx, OWNER_PERMISSIONS.VIEW, request);

    const { searchParams } = new URL(request.url);
    const query = listOwnersQuerySchema.parse({
      search: searchParams.get("search") ?? undefined,
      financialStatus: searchParams.get("financialStatus") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      pageSize: searchParams.get("pageSize") ?? undefined,
    });

    const result = await ownerService.listOwners(ctx.tenantId!, query);
    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await requireAuthContext("tenant");
    await requirePermission(ctx, OWNER_PERMISSIONS.CREATE, request);

    const body = await request.json();
    const input = createOwnerSchema.parse(body);

    const ownerId = await ownerService.createOwner(ctx.tenantId!, input, ctx.userId);
    return NextResponse.json({ ownerId }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
