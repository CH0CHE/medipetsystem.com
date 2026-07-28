import { NextResponse } from "next/server";
import { apiErrorResponse, ApiError } from "@/lib/http/api-error";
import { requireAuthContext, requirePermission } from "@/lib/auth/require-permission";
import {
  purchaseOrderService,
  createPurchaseOrderSchema,
  listPurchaseOrdersQuerySchema,
  PURCHASES_PERMISSIONS,
} from "@/modules/purchases";

export async function GET(request: Request) {
  try {
    const ctx = await requireAuthContext("tenant");
    await requirePermission(ctx, PURCHASES_PERMISSIONS.ORDERS_VIEW, request);

    const { searchParams } = new URL(request.url);
    const query = listPurchaseOrdersQuerySchema.parse({
      supplierId: searchParams.get("supplierId") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      pageSize: searchParams.get("pageSize") ?? undefined,
    });

    const result = await purchaseOrderService.listPurchaseOrders(ctx.tenantId!, query);
    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await requireAuthContext("tenant");
    await requirePermission(ctx, PURCHASES_PERMISSIONS.ORDERS_CREATE, request);

    if (!ctx.branchId) {
      throw new ApiError(400, "Tu usuario no tiene una sucursal asignada.", "NO_BRANCH");
    }

    const body = await request.json();
    const input = createPurchaseOrderSchema.parse(body);

    const purchaseOrderId = await purchaseOrderService.createPurchaseOrder(ctx.tenantId!, ctx.branchId, input, ctx.userId);
    return NextResponse.json({ purchaseOrderId }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
