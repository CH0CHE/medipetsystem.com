import { describe, it, expect } from "vitest";
import { createTenantSchema } from "./create-tenant.schema";

describe("createTenantSchema", () => {
  it("accepts a valid payload", () => {
    const result = createTenantSchema.safeParse({ clinicName: "Clínica ABC", branchName: "Central", plan: "PRO" });
    expect(result.success).toBe(true);
  });

  it("rejects a clinic name that is too short", () => {
    expect(createTenantSchema.safeParse({ clinicName: "A", branchName: "Central", plan: "BASIC" }).success).toBe(
      false,
    );
  });

  it("rejects an invalid plan", () => {
    expect(
      createTenantSchema.safeParse({ clinicName: "Clínica ABC", branchName: "Central", plan: "GOLD" }).success,
    ).toBe(false);
  });
});
