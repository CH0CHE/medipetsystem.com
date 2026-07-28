import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/http/api-error";
import { requireAuthContext, requirePermission } from "@/lib/auth/require-permission";
import { faqService, updateFaqSchema, CONTENT_PERMISSIONS } from "@/modules/content";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireAuthContext("platform-admin");
    await requirePermission(ctx, CONTENT_PERMISSIONS.FAQ_UPDATE, request);

    const { id } = await params;
    const body = await request.json();
    const input = updateFaqSchema.parse(body);

    await faqService.updateFaq(id, input, ctx.userId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireAuthContext("platform-admin");
    await requirePermission(ctx, CONTENT_PERMISSIONS.FAQ_DELETE, request);

    const { id } = await params;
    await faqService.deleteFaq(id, ctx.userId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
