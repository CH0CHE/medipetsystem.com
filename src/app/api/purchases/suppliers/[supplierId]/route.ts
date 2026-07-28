import { NextResponse } from "next/server";
import { apiErrorResponse, ApiError } from "@/lib/http/api-error";
import { requireAuthContext, requirePermission } from "@/lib/auth/require-permission";
import { supplierService, updateSupplierSchema, PURCHASES_PERMISSIONS } from "@/modules/purchases";

export async function GET(request: Request, { params }: { params: Promise<{ supplierId: string }> }) {
  try {
    const ctx = await requireAuthContext("tenant");
    await requirePermission(ctx, PURCHASES_PERMISSIONS.SUPPLIERS_VIEW, request);

    const { supplierId } = await params;
    const supplier = await supplierService.getSupplier(ctx.tenantId!, supplierId);
    if (!supplier) throw new ApiError(404, "Proveedor no encontrado.", "NOT_FOUND");

    return NextResponse.json({ supplier });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ supplierId: string }> }) {
  try {
    const ctx = await requireAuthContext("tenant");
    await requirePermission(ctx, PURCHASES_PERMISSIONS.SUPPLIERS_CREATE, request);

    const { supplierId } = await params;
    const body = await request.json();
    const input = updateSupplierSchema.parse(body);

    await supplierService.updateSupplier(ctx.tenantId!, supplierId, input, ctx.userId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
