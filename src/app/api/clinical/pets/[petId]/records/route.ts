import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/http/api-error";
import { requireAuthContext, requirePermission } from "@/lib/auth/require-permission";
import {
  medicalRecordService,
  createMedicalEntrySchema,
  listMedicalEntriesQuerySchema,
  MEDICAL_RECORD_PERMISSIONS,
} from "@/modules/medical-records";

export async function GET(request: Request, { params }: { params: Promise<{ petId: string }> }) {
  try {
    const ctx = await requireAuthContext("tenant");
    await requirePermission(ctx, MEDICAL_RECORD_PERMISSIONS.VIEW, request);

    const { petId } = await params;
    const { searchParams } = new URL(request.url);
    const query = listMedicalEntriesQuerySchema.parse({
      petId,
      type: searchParams.get("type") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      pageSize: searchParams.get("pageSize") ?? undefined,
    });

    const result = await medicalRecordService.listEntries(ctx.tenantId!, query);
    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ petId: string }> }) {
  try {
    const ctx = await requireAuthContext("tenant");
    await requirePermission(ctx, MEDICAL_RECORD_PERMISSIONS.CREATE, request);

    const { petId } = await params;
    const body = await request.json();
    const input = createMedicalEntrySchema.parse(body);

    const entryId = await medicalRecordService.createEntry(ctx.tenantId!, petId, ctx.userId, input);
    return NextResponse.json({ entryId }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
