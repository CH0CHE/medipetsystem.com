import { describe, it, expect } from "vitest";
import { loginSchema } from "./login.schema";

describe("loginSchema", () => {
  it("accepts valid input and defaults rememberMe to false", () => {
    const result = loginSchema.parse({ username: "0000001_ADMIN", password: "whatever" });
    expect(result.rememberMe).toBe(false);
  });

  it("rejects an empty username", () => {
    expect(loginSchema.safeParse({ username: "", password: "x" }).success).toBe(false);
  });

  it("rejects an empty password", () => {
    expect(loginSchema.safeParse({ username: "user", password: "" }).success).toBe(false);
  });

  it("trims whitespace from the username", () => {
    const result = loginSchema.parse({ username: "  0000001_ADMIN  ", password: "x" });
    expect(result.username).toBe("0000001_ADMIN");
  });
});
