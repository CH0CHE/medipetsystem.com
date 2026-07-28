import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/http/api-error";
import { plansService } from "@/modules/content";

export async function GET() {
  try {
    const plans = await plansService.listPlans();
    return NextResponse.json({ plans });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
