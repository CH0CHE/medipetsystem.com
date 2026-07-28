import { NextResponse } from "next/server";
import { apiErrorResponse, ApiError } from "@/lib/http/api-error";
import { requireAuthContext, requirePermission } from "@/lib/auth/require-permission";
import { invoiceService, createInvoiceSchema, listInvoicesQuerySchema, BILLING_PERMISSIONS } from "@/modules/billing";

export async function GET(request: Request) {
  try {
    const ctx = await requireAuthContext("tenant");
    await requirePermission(ctx, BILLING_PERMISSIONS.INVOICES_VIEW, request);

    const { searchParams } = new URL(request.url);
    const query = listInvoicesQuerySchema.parse({
      ownerId: searchParams.get("ownerId") ?? undefined,
      paymentStatus: searchParams.get("paymentStatus") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      pageSize: searchParams.get("pageSize") ?? undefined,
    });

    const result = await invoiceService.listInvoices(ctx.tenantId!, query);
    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await requireAuthContext("tenant");
    await requirePermission(ctx, BILLING_PERMISSIONS.INVOICES_CREATE, request);

    if (!ctx.branchId) {
      throw new ApiError(400, "Tu usuario no tiene una sucursal asignada.", "NO_BRANCH");
    }

    const body = await request.json();
    const input = createInvoiceSchema.parse(body);

    const invoiceId = await invoiceService.createInvoice(ctx.tenantId!, ctx.branchId, input, ctx.userId);
    return NextResponse.json({ invoiceId }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
