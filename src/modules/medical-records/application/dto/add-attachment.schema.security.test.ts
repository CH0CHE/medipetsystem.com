import { describe, it, expect } from "vitest";
import { addAttachmentSchema } from "./add-attachment.schema";

const base = { fileType: "PDF" as const, label: "Resultado de laboratorio" };

describe("addAttachmentSchema fileUrl scheme restriction", () => {
  it("accepts an https URL", () => {
    expect(addAttachmentSchema.safeParse({ ...base, fileUrl: "https://cdn.example.com/report.pdf" }).success).toBe(true);
  });

  it("accepts an http URL", () => {
    expect(addAttachmentSchema.safeParse({ ...base, fileUrl: "http://cdn.example.com/report.pdf" }).success).toBe(true);
  });

  it("rejects a javascript: URI", () => {
    expect(addAttachmentSchema.safeParse({ ...base, fileUrl: "javascript:alert(1)" }).success).toBe(false);
  });

  it("rejects a data: URI", () => {
    expect(addAttachmentSchema.safeParse({ ...base, fileUrl: "data:text/html,<script>alert(1)</script>" }).success).toBe(false);
  });

  it("rejects a file: URI", () => {
    expect(addAttachmentSchema.safeParse({ ...base, fileUrl: "file:///etc/passwd" }).success).toBe(false);
  });
});
