import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/http/api-error";
import { requireAuthContext, requirePermission } from "@/lib/auth/require-permission";
import { faqService, createFaqSchema, CONTENT_PERMISSIONS } from "@/modules/content";

export async function GET(request: Request) {
  try {
    const ctx = await requireAuthContext("platform-admin");
    await requirePermission(ctx, CONTENT_PERMISSIONS.FAQ_VIEW, request);

    const faqs = await faqService.listFaqs(false);
    return NextResponse.json({ faqs });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await requireAuthContext("platform-admin");
    await requirePermission(ctx, CONTENT_PERMISSIONS.FAQ_CREATE, request);

    const body = await request.json();
    const input = createFaqSchema.parse(body);

    const id = await faqService.createFaq(input, ctx.userId);
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
