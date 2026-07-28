import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/http/api-error";
import { requireAuthContext, requirePermission } from "@/lib/auth/require-permission";
import { productService, INVENTORY_PERMISSIONS } from "@/modules/inventory";

export async function GET(request: Request) {
  try {
    const ctx = await requireAuthContext("tenant");
    await requirePermission(ctx, INVENTORY_PERMISSIONS.VIEW, request);

    const { searchParams } = new URL(request.url);
    const maxDays = Number(searchParams.get("maxDays") ?? 90);
    const limit = Number(searchParams.get("limit") ?? 20);

    const items = await productService.listExpiringBatches(ctx.tenantId!, maxDays, limit);
    return NextResponse.json({ items });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
