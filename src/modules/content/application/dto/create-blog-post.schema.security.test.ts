import { describe, it, expect } from "vitest";
import { createBlogPostSchema } from "./create-blog-post.schema";

const base = {
  title: "Bienvenidos a MediPet",
  slug: "bienvenidos-a-medipet",
  excerpt: "Un resumen breve.",
  content: "Contenido del post.",
  status: "DRAFT" as const,
  authorName: "Equipo MediPet",
};

describe("createBlogPostSchema coverImageUrl scheme restriction", () => {
  it("accepts an https URL", () => {
    expect(createBlogPostSchema.safeParse({ ...base, coverImageUrl: "https://cdn.example.com/cover.jpg" }).success).toBe(true);
  });

  it("accepts an http URL", () => {
    expect(createBlogPostSchema.safeParse({ ...base, coverImageUrl: "http://cdn.example.com/cover.jpg" }).success).toBe(true);
  });

  it("accepts an empty string (no cover image)", () => {
    expect(createBlogPostSchema.safeParse({ ...base, coverImageUrl: "" }).success).toBe(true);
  });

  it("rejects a javascript: URI", () => {
    expect(createBlogPostSchema.safeParse({ ...base, coverImageUrl: "javascript:alert(1)" }).success).toBe(false);
  });

  it("rejects a data: URI", () => {
    expect(createBlogPostSchema.safeParse({ ...base, coverImageUrl: "data:text/html,<script>alert(1)</script>" }).success).toBe(false);
  });
});

describe("createBlogPostSchema slug format", () => {
  it("rejects slugs with spaces or uppercase", () => {
    expect(createBlogPostSchema.safeParse({ ...base, slug: "Con Espacios" }).success).toBe(false);
  });

  it("rejects slugs with special characters", () => {
    expect(createBlogPostSchema.safeParse({ ...base, slug: "hola/../etc" }).success).toBe(false);
  });
});
