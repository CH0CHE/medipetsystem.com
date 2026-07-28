import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/http/api-error";
import { requireAuthContext, requirePermission } from "@/lib/auth/require-permission";
import { settingsService, updatePasswordPolicySchema, SETTINGS_PERMISSIONS } from "@/modules/settings";

export async function GET() {
  try {
    // Cualquier usuario autenticado del tenant necesita conocer la política vigente
    // para cambiar su propia contraseña — no se exige el permiso de administración aquí.
    const ctx = await requireAuthContext("tenant");
    const policy = await settingsService.getEffectivePasswordPolicy(ctx.tenantId!);
    return NextResponse.json({ policy });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PUT(request: Request) {
  try {
    const ctx = await requireAuthContext("tenant");
    await requirePermission(ctx, SETTINGS_PERMISSIONS.PASSWORD_POLICY_UPDATE, request);

    const body = await request.json();
    const input = updatePasswordPolicySchema.parse(body);

    await settingsService.updatePasswordPolicy(ctx.tenantId!, input, ctx.userId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
