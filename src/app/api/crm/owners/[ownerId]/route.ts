import { NextResponse } from "next/server";
import { apiErrorResponse, ApiError } from "@/lib/http/api-error";
import { requireAuthContext, requirePermission } from "@/lib/auth/require-permission";
import { ownerService, updateOwnerSchema, OWNER_PERMISSIONS } from "@/modules/owners";

export async function GET(request: Request, { params }: { params: Promise<{ ownerId: string }> }) {
  try {
    const ctx = await requireAuthContext("tenant");
    await requirePermission(ctx, OWNER_PERMISSIONS.VIEW, request);

    const { ownerId } = await params;
    const owner = await ownerService.getOwner(ctx.tenantId!, ownerId);
    if (!owner) throw new ApiError(404, "Propietario no encontrado.", "NOT_FOUND");

    return NextResponse.json({ owner });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ ownerId: string }> }) {
  try {
    const ctx = await requireAuthContext("tenant");
    await requirePermission(ctx, OWNER_PERMISSIONS.UPDATE, request);

    const { ownerId } = await params;
    const body = await request.json();
    const input = updateOwnerSchema.parse(body);

    await ownerService.updateOwner(ctx.tenantId!, ownerId, input, ctx.userId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
