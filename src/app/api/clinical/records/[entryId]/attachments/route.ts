import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/http/api-error";
import { requireAuthContext, requirePermission } from "@/lib/auth/require-permission";
import { medicalRecordService, addAttachmentSchema, MEDICAL_RECORD_PERMISSIONS } from "@/modules/medical-records";

export async function POST(request: Request, { params }: { params: Promise<{ entryId: string }> }) {
  try {
    const ctx = await requireAuthContext("tenant");
    await requirePermission(ctx, MEDICAL_RECORD_PERMISSIONS.CREATE_ATTACHMENT, request);

    const { entryId } = await params;
    const body = await request.json();
    const input = addAttachmentSchema.parse(body);

    const attachmentId = await medicalRecordService.addAttachment(ctx.tenantId!, entryId, input, ctx.userId);
    return NextResponse.json({ attachmentId }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
