import { describe, it, expect } from "vitest";
import { generateCsrfToken, csrfTokensMatch, requiresCsrfCheck } from "./csrf";

describe("csrf", () => {
  it("generates a non-empty, url-safe token", () => {
    const token = generateCsrfToken();
    expect(token.length).toBeGreaterThan(20);
    expect(token).not.toMatch(/[+/=]/);
  });

  it("generates a different token on each call", () => {
    expect(generateCsrfToken()).not.toEqual(generateCsrfToken());
  });

  it("matches identical cookie and header tokens", () => {
    const token = generateCsrfToken();
    expect(csrfTokensMatch(token, token)).toBe(true);
  });

  it("rejects mismatched tokens", () => {
    expect(csrfTokensMatch(generateCsrfToken(), generateCsrfToken())).toBe(false);
  });

  it("rejects when either token is missing", () => {
    expect(csrfTokensMatch(undefined, "abc")).toBe(false);
    expect(csrfTokensMatch("abc", undefined)).toBe(false);
    expect(csrfTokensMatch(undefined, undefined)).toBe(false);
  });

  it("flags mutating methods as requiring CSRF checks", () => {
    expect(requiresCsrfCheck("POST")).toBe(true);
    expect(requiresCsrfCheck("put")).toBe(true);
    expect(requiresCsrfCheck("PATCH")).toBe(true);
    expect(requiresCsrfCheck("DELETE")).toBe(true);
  });

  it("does not flag safe methods", () => {
    expect(requiresCsrfCheck("GET")).toBe(false);
    expect(requiresCsrfCheck("HEAD")).toBe(false);
    expect(requiresCsrfCheck("OPTIONS")).toBe(false);
  });
});
