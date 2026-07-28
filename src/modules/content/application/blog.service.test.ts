import { describe, it, expect, vi } from "vitest";
import { BlogService } from "./blog.service";
import type { IBlogRepository } from "../domain/repositories";

function makeRepoMock(): IBlogRepository {
  return {
    listAdmin: vi.fn().mockResolvedValue({ items: [], totalCount: 0 }),
    listPublished: vi.fn().mockResolvedValue({ items: [], totalCount: 0 }),
    get: vi.fn().mockResolvedValue(null),
    getPublishedBySlug: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue("post-1"),
    update: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
  };
}

describe("BlogService.listAdminPosts", () => {
  it("converts page/pageSize into limit/offset and forwards the status filter", async () => {
    const repo = makeRepoMock();
    const service = new BlogService(repo);

    await service.listAdminPosts({ status: "DRAFT", page: 2, pageSize: 10 });

    expect(repo.listAdmin).toHaveBeenCalledWith({ status: "DRAFT", limit: 10, offset: 10 });
  });
});

describe("BlogService.listPublishedPosts", () => {
  it("converts page/pageSize into limit/offset", async () => {
    const repo = makeRepoMock();
    const service = new BlogService(repo);

    await service.listPublishedPosts(1, 6);

    expect(repo.listPublished).toHaveBeenCalledWith({ limit: 6, offset: 0 });
  });
});

describe("BlogService.createPost", () => {
  it("normalizes an empty coverImageUrl to null and forwards actorUserId", async () => {
    const repo = makeRepoMock();
    const service = new BlogService(repo);

    const id = await service.createPost(
      {
        title: "Bienvenidos",
        slug: "bienvenidos",
        excerpt: "Resumen",
        content: "Contenido",
        coverImageUrl: "",
        status: "DRAFT",
        authorName: "Equipo MediPet",
      },
      "actor-1",
    );

    expect(id).toBe("post-1");
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Bienvenidos", slug: "bienvenidos", coverImageUrl: null, actorUserId: "actor-1" }),
    );
  });

  it("preserves a real coverImageUrl", async () => {
    const repo = makeRepoMock();
    const service = new BlogService(repo);

    await service.createPost(
      {
        title: "Bienvenidos",
        slug: "bienvenidos",
        excerpt: "Resumen",
        content: "Contenido",
        coverImageUrl: "https://cdn.example.com/cover.jpg",
        status: "PUBLISHED",
        authorName: "Equipo MediPet",
      },
      "actor-1",
    );

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ coverImageUrl: "https://cdn.example.com/cover.jpg", status: "PUBLISHED" }),
    );
  });
});

describe("BlogService.updatePost", () => {
  it("forwards the id and normalized fields to the repository", async () => {
    const repo = makeRepoMock();
    const service = new BlogService(repo);

    await service.updatePost(
      "post-1",
      {
        title: "Bienvenidos v2",
        slug: "bienvenidos",
        excerpt: "Resumen actualizado",
        content: "Contenido actualizado",
        coverImageUrl: "",
        status: "PUBLISHED",
        authorName: "Equipo MediPet",
      },
      "actor-1",
    );

    expect(repo.update).toHaveBeenCalledWith(
      expect.objectContaining({ id: "post-1", title: "Bienvenidos v2", coverImageUrl: null, status: "PUBLISHED" }),
    );
  });
});

describe("BlogService.deletePost", () => {
  it("delegates to the repository", async () => {
    const repo = makeRepoMock();
    const service = new BlogService(repo);

    await service.deletePost("post-1", "actor-1");

    expect(repo.delete).toHaveBeenCalledWith("post-1", "actor-1");
  });
});
