import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/http/api-error";
import { requireAuthContext, requirePermission } from "@/lib/auth/require-permission";
import { invoiceService, BILLING_PERMISSIONS } from "@/modules/billing";

export async function GET(request: Request, { params }: { params: Promise<{ ownerId: string }> }) {
  try {
    const ctx = await requireAuthContext("tenant");
    await requirePermission(ctx, BILLING_PERMISSIONS.INVOICES_VIEW, request);

    const { ownerId } = await params;
    const statement = await invoiceService.getAccountStatement(ctx.tenantId!, ownerId);
    return NextResponse.json(statement);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
