import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/http/api-error";
import { requireAuthContext, requirePermission } from "@/lib/auth/require-permission";
import { productService, createProductSchema, listProductsQuerySchema, INVENTORY_PERMISSIONS } from "@/modules/inventory";

export async function GET(request: Request) {
  try {
    const ctx = await requireAuthContext("tenant");
    await requirePermission(ctx, INVENTORY_PERMISSIONS.VIEW, request);

    const { searchParams } = new URL(request.url);
    const query = listProductsQuerySchema.parse({
      search: searchParams.get("search") ?? undefined,
      category: searchParams.get("category") ?? undefined,
      lowStockOnly: searchParams.get("lowStockOnly") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      pageSize: searchParams.get("pageSize") ?? undefined,
    });

    const result = await productService.listProducts(ctx.tenantId!, query);
    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await requireAuthContext("tenant");
    await requirePermission(ctx, INVENTORY_PERMISSIONS.CREATE, request);

    const body = await request.json();
    const input = createProductSchema.parse(body);

    const productId = await productService.createProduct(ctx.tenantId!, input, ctx.userId);
    return NextResponse.json({ productId }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
