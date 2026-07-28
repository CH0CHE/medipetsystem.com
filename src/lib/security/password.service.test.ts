import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword, generateTemporaryPassword } from "./password.service";
import { passwordSchema } from "./password-policy";

describe("password.service", () => {
  it("generates a unique salt per call", async () => {
    const a = await hashPassword("Sup3r$ecret!");
    const b = await hashPassword("Sup3r$ecret!");
    expect(a.salt).not.toEqual(b.salt);
    expect(a.hash).not.toEqual(b.hash);
  });

  it("verifies a correct password as true", async () => {
    const { hash } = await hashPassword("Correcta123!");
    await expect(verifyPassword(hash, "Correcta123!")).resolves.toBe(true);
  });

  it("verifies an incorrect password as false", async () => {
    const { hash } = await hashPassword("Correcta123!");
    await expect(verifyPassword(hash, "Incorrecta123!")).resolves.toBe(false);
  });

  it("never throws on a malformed hash, returns false instead", async () => {
    await expect(verifyPassword("not-a-real-hash", "whatever")).resolves.toBe(false);
  });

  it("generates a temporary password that satisfies the complexity policy", () => {
    const temp = generateTemporaryPassword();
    expect(() => passwordSchema.parse(temp)).not.toThrow();
  });

  it("generates different temporary passwords on each call", () => {
    const a = generateTemporaryPassword();
    const b = generateTemporaryPassword();
    expect(a).not.toEqual(b);
  });
});

describe("passwordSchema (complexity policy)", () => {
  it("rejects passwords that are too short", () => {
    expect(passwordSchema.safeParse("Ab1!").success).toBe(false);
  });

  it("rejects passwords missing an uppercase letter", () => {
    expect(passwordSchema.safeParse("nouppercase1!").success).toBe(false);
  });

  it("rejects passwords missing a symbol", () => {
    expect(passwordSchema.safeParse("NoSymbolHere1").success).toBe(false);
  });

  it("accepts a password meeting every rule", () => {
    expect(passwordSchema.safeParse("Valid$Password1").success).toBe(true);
  });
});
