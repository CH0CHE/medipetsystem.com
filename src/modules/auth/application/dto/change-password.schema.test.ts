import { describe, it, expect } from "vitest";
import { changePasswordSchema } from "./change-password.schema";

describe("changePasswordSchema", () => {
  const valid = { currentPassword: "OldPass1!!", newPassword: "NewPass$22", confirmPassword: "NewPass$22" };

  it("accepts matching, policy-compliant passwords", () => {
    expect(changePasswordSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects when confirmPassword does not match newPassword", () => {
    const result = changePasswordSchema.safeParse({ ...valid, confirmPassword: "Different1!" });
    expect(result.success).toBe(false);
  });

  it("rejects when the new password equals the current password", () => {
    const result = changePasswordSchema.safeParse({ ...valid, newPassword: valid.currentPassword, confirmPassword: valid.currentPassword });
    expect(result.success).toBe(false);
  });

  it("rejects a new password that fails the complexity policy", () => {
    const result = changePasswordSchema.safeParse({ ...valid, newPassword: "weak", confirmPassword: "weak" });
    expect(result.success).toBe(false);
  });
});
