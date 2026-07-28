import { NextResponse } from "next/server";
import { apiErrorResponse, ApiError } from "@/lib/http/api-error";
import { requireAuthContext, requirePermission } from "@/lib/auth/require-permission";
import { purchaseOrderService, PURCHASES_PERMISSIONS } from "@/modules/purchases";

export async function GET(request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    const ctx = await requireAuthContext("tenant");
    await requirePermission(ctx, PURCHASES_PERMISSIONS.ORDERS_VIEW, request);

    const { orderId } = await params;
    const order = await purchaseOrderService.getPurchaseOrder(ctx.tenantId!, orderId);
    if (!order) throw new ApiError(404, "Orden de compra no encontrada.", "NOT_FOUND");

    return NextResponse.json({ order });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
