import { NextResponse } from "next/server";
import { apiErrorResponse, ApiError } from "@/lib/http/api-error";
import { requireAuthContext, requirePermission } from "@/lib/auth/require-permission";
import { invoiceService, BILLING_PERMISSIONS } from "@/modules/billing";

export async function GET(request: Request, { params }: { params: Promise<{ invoiceId: string }> }) {
  try {
    const ctx = await requireAuthContext("tenant");
    await requirePermission(ctx, BILLING_PERMISSIONS.INVOICES_VIEW, request);

    const { invoiceId } = await params;
    const invoice = await invoiceService.getInvoice(ctx.tenantId!, invoiceId);
    if (!invoice) throw new ApiError(404, "Factura no encontrada.", "NOT_FOUND");

    return NextResponse.json({ invoice });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
