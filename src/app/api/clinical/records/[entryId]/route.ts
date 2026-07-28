import { NextResponse } from "next/server";
import { apiErrorResponse, ApiError } from "@/lib/http/api-error";
import { requireAuthContext, requirePermission } from "@/lib/auth/require-permission";
import { medicalRecordService, MEDICAL_RECORD_PERMISSIONS } from "@/modules/medical-records";

export async function GET(request: Request, { params }: { params: Promise<{ entryId: string }> }) {
  try {
    const ctx = await requireAuthContext("tenant");
    await requirePermission(ctx, MEDICAL_RECORD_PERMISSIONS.VIEW, request);

    const { entryId } = await params;
    const entry = await medicalRecordService.getEntry(ctx.tenantId!, entryId);
    if (!entry) throw new ApiError(404, "Entrada de expediente no encontrada.", "NOT_FOUND");

    return NextResponse.json({ entry });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
