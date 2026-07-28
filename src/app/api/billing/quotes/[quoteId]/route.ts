import { NextResponse } from "next/server";
import { apiErrorResponse, ApiError } from "@/lib/http/api-error";
import { requireAuthContext, requirePermission } from "@/lib/auth/require-permission";
import { quoteService, BILLING_PERMISSIONS } from "@/modules/billing";

export async function GET(request: Request, { params }: { params: Promise<{ quoteId: string }> }) {
  try {
    const ctx = await requireAuthContext("tenant");
    await requirePermission(ctx, BILLING_PERMISSIONS.QUOTES_VIEW, request);

    const { quoteId } = await params;
    const quote = await quoteService.getQuote(ctx.tenantId!, quoteId);
    if (!quote) throw new ApiError(404, "Cotización no encontrada.", "NOT_FOUND");

    return NextResponse.json({ quote });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
