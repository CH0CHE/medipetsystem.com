import { NextResponse } from "next/server";
import { z } from "zod";
import { apiErrorResponse } from "@/lib/http/api-error";
import { requireAuthContext, requirePermission } from "@/lib/auth/require-permission";
import { billingService, createInvoiceSchema, listInvoicesQuerySchema, PLATFORM_ADMIN_PERMISSIONS } from "@/modules/platform-admin";

const createInvoiceBodySchema = createInvoiceSchema.extend({ tenantId: z.string().uuid() });

export async function GET(request: Request) {
  try {
    const ctx = await requireAuthContext("platform-admin");
    await requirePermission(ctx, PLATFORM_ADMIN_PERMISSIONS.BILLING_VIEW, request);

    const { searchParams } = new URL(request.url);
    const query = listInvoicesQuerySchema.parse({
      tenantId: searchParams.get("tenantId") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      pageSize: searchParams.get("pageSize") ?? undefined,
    });

    const result = await billingService.listInvoices(query);
    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await requireAuthContext("platform-admin");
    await requirePermission(ctx, PLATFORM_ADMIN_PERMISSIONS.BILLING_CREATE, request);

    const body = await request.json();
    const input = createInvoiceBodySchema.parse(body);

    const invoiceId = await billingService.createInvoice(input.tenantId, input, ctx.userId);
    return NextResponse.json({ invoiceId }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
