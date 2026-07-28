import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/http/api-error";
import { requireAuthContext, requirePermission } from "@/lib/auth/require-permission";
import { purchaseOrderService, PURCHASES_PERMISSIONS } from "@/modules/purchases";

export async function POST(request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    const ctx = await requireAuthContext("tenant");
    await requirePermission(ctx, PURCHASES_PERMISSIONS.ORDERS_CANCEL, request);

    const { orderId } = await params;
    await purchaseOrderService.cancelPurchaseOrder(ctx.tenantId!, orderId, ctx.userId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
