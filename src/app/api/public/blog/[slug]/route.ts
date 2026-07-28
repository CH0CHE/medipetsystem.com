import { NextResponse } from "next/server";
import { apiErrorResponse, ApiError } from "@/lib/http/api-error";
import { blogService } from "@/modules/content";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const post = await blogService.getPublishedPostBySlug(slug);
    if (!post) throw new ApiError(404, "Post no encontrado.", "NOT_FOUND");

    return NextResponse.json({ post });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
