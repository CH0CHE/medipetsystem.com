import { NextResponse } from "next/server";
import { apiErrorResponse, ApiError } from "@/lib/http/api-error";
import { requireAuthContext, requirePermission } from "@/lib/auth/require-permission";
import { petService, createPetSchema, listPetsQuerySchema, PET_PERMISSIONS } from "@/modules/pets";

export async function GET(request: Request) {
  try {
    const ctx = await requireAuthContext("tenant");
    await requirePermission(ctx, PET_PERMISSIONS.VIEW, request);

    const { searchParams } = new URL(request.url);
    const query = listPetsQuerySchema.parse({
      search: searchParams.get("search") ?? undefined,
      species: searchParams.get("species") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      ownerId: searchParams.get("ownerId") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      pageSize: searchParams.get("pageSize") ?? undefined,
    });

    const result = await petService.listPets(ctx.tenantId!, query);
    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await requireAuthContext("tenant");
    await requirePermission(ctx, PET_PERMISSIONS.CREATE, request);

    if (!ctx.branchId) {
      throw new ApiError(400, "Tu usuario no tiene una sucursal asignada.", "NO_BRANCH");
    }

    const body = await request.json();
    const input = createPetSchema.parse(body);

    const petId = await petService.createPet(ctx.tenantId!, ctx.branchId, input, ctx.userId);
    return NextResponse.json({ petId }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
