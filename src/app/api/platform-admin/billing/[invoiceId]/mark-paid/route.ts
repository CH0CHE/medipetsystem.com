import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/http/api-error";
import { requireAuthContext, requirePermission } from "@/lib/auth/require-permission";
import { billingService, PLATFORM_ADMIN_PERMISSIONS } from "@/modules/platform-admin";

export async function POST(request: Request, { params }: { params: Promise<{ invoiceId: string }> }) {
  try {
    const ctx = await requireAuthContext("platform-admin");
    await requirePermission(ctx, PLATFORM_ADMIN_PERMISSIONS.BILLING_MARK_PAID, request);

    const { invoiceId } = await params;
    await billingService.markInvoicePaid(invoiceId, ctx.userId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
