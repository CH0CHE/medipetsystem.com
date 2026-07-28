import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/http/api-error";
import { leadService, createLeadSchema } from "@/modules/leads";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = createLeadSchema.parse(body);

    await leadService.createLead(input);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
