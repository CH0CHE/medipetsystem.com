import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/http/api-error";
import { requireAuthContext, requirePermission } from "@/lib/auth/require-permission";
import { invoiceService, registerPaymentSchema, BILLING_PERMISSIONS } from "@/modules/billing";

export async function POST(request: Request, { params }: { params: Promise<{ invoiceId: string }> }) {
  try {
    const ctx = await requireAuthContext("tenant");
    await requirePermission(ctx, BILLING_PERMISSIONS.PAYMENTS_CREATE, request);

    const { invoiceId } = await params;
    const body = await request.json();
    const input = registerPaymentSchema.parse(body);

    const paymentId = await invoiceService.registerPayment(ctx.tenantId!, invoiceId, input, ctx.userId);
    return NextResponse.json({ paymentId }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
