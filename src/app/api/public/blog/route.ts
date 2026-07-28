import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/http/api-error";
import { blogService } from "@/modules/content";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page") ?? "1") || 1;
    const pageSize = Number(searchParams.get("pageSize") ?? "9") || 9;

    const result = await blogService.listPublishedPosts(page, pageSize);
    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
