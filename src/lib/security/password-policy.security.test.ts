import { describe, it, expect } from "vitest";
import { buildPasswordSchema, resolvePasswordPolicy, DEFAULT_PASSWORD_POLICY } from "./password-policy";

describe("resolvePasswordPolicy", () => {
  it("returns the default policy untouched when there is no tenant override", () => {
    expect(resolvePasswordPolicy(null)).toEqual(DEFAULT_PASSWORD_POLICY);
    expect(resolvePasswordPolicy(undefined)).toEqual(DEFAULT_PASSWORD_POLICY);
  });

  it("merges a partial tenant override on top of the default", () => {
    const resolved = resolvePasswordPolicy({ minLength: 6, requireSymbol: false });
    expect(resolved.minLength).toBe(6);
    expect(resolved.requireSymbol).toBe(false);
    expect(resolved.requireUppercase).toBe(DEFAULT_PASSWORD_POLICY.requireUppercase);
  });
});

describe("buildPasswordSchema with the default policy", () => {
  const schema = buildPasswordSchema(DEFAULT_PASSWORD_POLICY);

  it("rejects a password shorter than minLength", () => {
    expect(schema.safeParse("Ab1!").success).toBe(false);
  });

  it("accepts a password satisfying every default rule", () => {
    expect(schema.safeParse("Valid$Password1").success).toBe(true);
  });
});

describe("buildPasswordSchema with a relaxed tenant override", () => {
  const relaxedPolicy = resolvePasswordPolicy({ minLength: 6, requireSymbol: false });
  const schema = buildPasswordSchema(relaxedPolicy);

  it("accepts a short password without a symbol once the tenant has relaxed the policy", () => {
    expect(schema.safeParse("Abc123").success).toBe(true);
  });

  it("still enforces the rules the tenant did not relax (uppercase stays required)", () => {
    expect(schema.safeParse("abc123").success).toBe(false); // no uppercase — the override never touched requireUppercase
    const symbolStillRequiredPolicy = resolvePasswordPolicy({ minLength: 6 });
    const symbolStillRequiredSchema = buildPasswordSchema(symbolStillRequiredPolicy);
    expect(symbolStillRequiredSchema.safeParse("Abc123").success).toBe(false); // still missing a symbol
  });

  it("never lets a relaxed tenant policy affect the application default", () => {
    expect(DEFAULT_PASSWORD_POLICY.minLength).toBe(10);
    expect(DEFAULT_PASSWORD_POLICY.requireSymbol).toBe(true);
  });
});
