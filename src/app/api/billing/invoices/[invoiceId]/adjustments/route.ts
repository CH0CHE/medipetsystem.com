import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/http/api-error";
import { requireAuthContext, requirePermission } from "@/lib/auth/require-permission";
import { invoiceService, createAdjustmentSchema, BILLING_PERMISSIONS } from "@/modules/billing";

export async function POST(request: Request, { params }: { params: Promise<{ invoiceId: string }> }) {
  try {
    const ctx = await requireAuthContext("tenant");
    await requirePermission(ctx, BILLING_PERMISSIONS.ADJUSTMENTS_CREATE, request);

    const { invoiceId } = await params;
    const body = await request.json();
    const input = createAdjustmentSchema.parse(body);

    const noteId = await invoiceService.createAdjustmentNote(ctx.tenantId!, invoiceId, input, ctx.userId);
    return NextResponse.json({ noteId }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
