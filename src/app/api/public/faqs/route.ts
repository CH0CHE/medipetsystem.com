import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/http/api-error";
import { faqService } from "@/modules/content";

export async function GET() {
  try {
    const faqs = await faqService.listFaqs(true);
    return NextResponse.json({ faqs });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
