import { NextResponse } from "next/server";
import { apiErrorResponse, ApiError } from "@/lib/http/api-error";
import { requireAuthContext, requirePermission } from "@/lib/auth/require-permission";
import { productService, updateProductSchema, INVENTORY_PERMISSIONS } from "@/modules/inventory";

export async function GET(request: Request, { params }: { params: Promise<{ productId: string }> }) {
  try {
    const ctx = await requireAuthContext("tenant");
    await requirePermission(ctx, INVENTORY_PERMISSIONS.VIEW, request);

    const { productId } = await params;
    const product = await productService.getProduct(ctx.tenantId!, productId);
    if (!product) throw new ApiError(404, "Producto no encontrado.", "NOT_FOUND");

    return NextResponse.json({ product });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ productId: string }> }) {
  try {
    const ctx = await requireAuthContext("tenant");
    await requirePermission(ctx, INVENTORY_PERMISSIONS.UPDATE, request);

    const { productId } = await params;
    const body = await request.json();
    const input = updateProductSchema.parse(body);

    await productService.updateProduct(ctx.tenantId!, productId, input, ctx.userId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
