import { NextResponse } from "next/server";
import { apiErrorResponse, ApiError } from "@/lib/http/api-error";
import { requireAuthContext, requirePermission } from "@/lib/auth/require-permission";
import { blogService, updateBlogPostSchema, CONTENT_PERMISSIONS } from "@/modules/content";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireAuthContext("platform-admin");
    await requirePermission(ctx, CONTENT_PERMISSIONS.BLOG_VIEW, request);

    const { id } = await params;
    const post = await blogService.getPost(id);
    if (!post) throw new ApiError(404, "Post no encontrado.", "NOT_FOUND");

    return NextResponse.json({ post });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireAuthContext("platform-admin");
    await requirePermission(ctx, CONTENT_PERMISSIONS.BLOG_UPDATE, request);

    const { id } = await params;
    const body = await request.json();
    const input = updateBlogPostSchema.parse(body);

    await blogService.updatePost(id, input, ctx.userId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireAuthContext("platform-admin");
    await requirePermission(ctx, CONTENT_PERMISSIONS.BLOG_DELETE, request);

    const { id } = await params;
    await blogService.deletePost(id, ctx.userId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
