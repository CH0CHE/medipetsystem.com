import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/http/api-error";
import { requireAuthContext, requirePermission } from "@/lib/auth/require-permission";
import { supplierService, createSupplierSchema, listSuppliersQuerySchema, PURCHASES_PERMISSIONS } from "@/modules/purchases";

export async function GET(request: Request) {
  try {
    const ctx = await requireAuthContext("tenant");
    await requirePermission(ctx, PURCHASES_PERMISSIONS.SUPPLIERS_VIEW, request);

    const { searchParams } = new URL(request.url);
    const query = listSuppliersQuerySchema.parse({
      search: searchParams.get("search") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      pageSize: searchParams.get("pageSize") ?? undefined,
    });

    const result = await supplierService.listSuppliers(ctx.tenantId!, query);
    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await requireAuthContext("tenant");
    await requirePermission(ctx, PURCHASES_PERMISSIONS.SUPPLIERS_CREATE, request);

    const body = await request.json();
    const input = createSupplierSchema.parse(body);

    const supplierId = await supplierService.createSupplier(ctx.tenantId!, input, ctx.userId);
    return NextResponse.json({ supplierId }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
