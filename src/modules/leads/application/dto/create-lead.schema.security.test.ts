import { describe, it, expect } from "vitest";
import { createLeadSchema } from "./create-lead.schema";

const base = { fullName: "Ana Pérez", email: "ana@example.com", source: "CONTACTO" as const };

describe("createLeadSchema email format", () => {
  it("accepts a well-formed email", () => {
    expect(createLeadSchema.safeParse(base).success).toBe(true);
  });

  it("rejects a malformed email", () => {
    expect(createLeadSchema.safeParse({ ...base, email: "no-es-un-correo" }).success).toBe(false);
  });

  it("rejects an empty email", () => {
    expect(createLeadSchema.safeParse({ ...base, email: "" }).success).toBe(false);
  });
});

describe("createLeadSchema length limits", () => {
  it("rejects a fullName over 150 characters", () => {
    expect(createLeadSchema.safeParse({ ...base, fullName: "a".repeat(151) }).success).toBe(false);
  });

  it("rejects a message over 2000 characters", () => {
    expect(createLeadSchema.safeParse({ ...base, message: "a".repeat(2001) }).success).toBe(false);
  });

  it("accepts a message at exactly the limit", () => {
    expect(createLeadSchema.safeParse({ ...base, message: "a".repeat(2000) }).success).toBe(true);
  });
});

describe("createLeadSchema source", () => {
  it("rejects a source outside the enum", () => {
    expect(createLeadSchema.safeParse({ ...base, source: "OTRO" }).success).toBe(false);
  });
});
