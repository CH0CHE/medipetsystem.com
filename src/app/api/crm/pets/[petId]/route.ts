import { NextResponse } from "next/server";
import { apiErrorResponse, ApiError } from "@/lib/http/api-error";
import { requireAuthContext, requirePermission } from "@/lib/auth/require-permission";
import { petService, updatePetSchema, PET_PERMISSIONS } from "@/modules/pets";

export async function GET(request: Request, { params }: { params: Promise<{ petId: string }> }) {
  try {
    const ctx = await requireAuthContext("tenant");
    await requirePermission(ctx, PET_PERMISSIONS.VIEW, request);

    const { petId } = await params;
    const pet = await petService.getPet(ctx.tenantId!, petId);
    if (!pet) throw new ApiError(404, "Paciente no encontrado.", "NOT_FOUND");

    return NextResponse.json({ pet });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ petId: string }> }) {
  try {
    const ctx = await requireAuthContext("tenant");
    await requirePermission(ctx, PET_PERMISSIONS.UPDATE, request);

    const { petId } = await params;
    const body = await request.json();
    const input = updatePetSchema.parse(body);

    await petService.updatePet(ctx.tenantId!, petId, input, ctx.userId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
