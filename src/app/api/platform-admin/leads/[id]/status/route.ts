import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/http/api-error";
import { requireAuthContext, requirePermission } from "@/lib/auth/require-permission";
import { leadService, updateLeadStatusSchema, LEADS_PERMISSIONS } from "@/modules/leads";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireAuthContext("platform-admin");
    await requirePermission(ctx, LEADS_PERMISSIONS.UPDATE, request);

    const { id } = await params;
    const body = await request.json();
    const input = updateLeadStatusSchema.parse(body);

    await leadService.updateLeadStatus(id, input.status, ctx.userId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
