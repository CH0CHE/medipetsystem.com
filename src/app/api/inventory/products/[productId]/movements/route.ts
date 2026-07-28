import { NextResponse } from "next/server";
import { apiErrorResponse, ApiError } from "@/lib/http/api-error";
import { requireAuthContext, requirePermission } from "@/lib/auth/require-permission";
import { productService, registerMovementSchema, INVENTORY_PERMISSIONS } from "@/modules/inventory";
import { listProductsQuerySchema } from "@/modules/inventory";

export async function GET(request: Request, { params }: { params: Promise<{ productId: string }> }) {
  try {
    const ctx = await requireAuthContext("tenant");
    await requirePermission(ctx, INVENTORY_PERMISSIONS.VIEW, request);

    const { productId } = await params;
    const { searchParams } = new URL(request.url);
    const { page, pageSize } = listProductsQuerySchema.pick({ page: true, pageSize: true }).parse({
      page: searchParams.get("page") ?? undefined,
      pageSize: searchParams.get("pageSize") ?? undefined,
    });

    const result = await productService.listMovements(ctx.tenantId!, productId, { page, pageSize });
    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ productId: string }> }) {
  try {
    const ctx = await requireAuthContext("tenant");
    await requirePermission(ctx, INVENTORY_PERMISSIONS.CREATE_MOVEMENT, request);

    const { productId } = await params;
    const body = await request.json();
    const input = registerMovementSchema.parse(body);

    if (input.type === "ENTRADA" && !ctx.branchId) {
      throw new ApiError(400, "Tu usuario no tiene una sucursal asignada.", "NO_BRANCH");
    }

    const movementId = await productService.registerMovement(
      ctx.tenantId!,
      productId,
      ctx.branchId!,
      input,
      ctx.userId,
    );
    return NextResponse.json({ movementId }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
