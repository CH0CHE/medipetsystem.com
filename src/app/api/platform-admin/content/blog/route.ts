import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/http/api-error";
import { requireAuthContext, requirePermission } from "@/lib/auth/require-permission";
import { blogService, createBlogPostSchema, listBlogPostsQuerySchema, CONTENT_PERMISSIONS } from "@/modules/content";

export async function GET(request: Request) {
  try {
    const ctx = await requireAuthContext("platform-admin");
    await requirePermission(ctx, CONTENT_PERMISSIONS.BLOG_VIEW, request);

    const { searchParams } = new URL(request.url);
    const query = listBlogPostsQuerySchema.parse({
      status: searchParams.get("status") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      pageSize: searchParams.get("pageSize") ?? undefined,
    });

    const result = await blogService.listAdminPosts(query);
    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await requireAuthContext("platform-admin");
    await requirePermission(ctx, CONTENT_PERMISSIONS.BLOG_CREATE, request);

    const body = await request.json();
    const input = createBlogPostSchema.parse(body);

    const id = await blogService.createPost(input, ctx.userId);
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
