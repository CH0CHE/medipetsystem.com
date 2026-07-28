// @vitest-environment node
// jose's internal `instanceof Uint8Array` checks fail under jsdom's cross-realm
// globals — this suite needs the plain Node environment, not jsdom.
import { describe, it, expect, beforeAll } from "vitest";
import { signAccessToken, verifyAccessToken, type AccessTokenClaimsData } from "./token.service";

const SAMPLE_CLAIMS: AccessTokenClaimsData = {
  sub: "user-123",
  tenantId: "tenant-abc",
  tenantCode: "0000001",
  branchId: "branch-1",
  username: "0000001_ADMIN",
  roles: ["ADMINISTRADOR"],
  permissions: [],
  isSuperAdmin: false,
  isSupportAccount: false,
  mustChangePassword: false,
};

beforeAll(() => {
  process.env.JWT_ACCESS_SECRET = "test-only-secret-do-not-use-in-prod-0123456789";
  process.env.JWT_ACCESS_TTL_SECONDS = "900";
});

describe("token.service", () => {
  it("signs and verifies a round-trip access token", async () => {
    const token = await signAccessToken(SAMPLE_CLAIMS);
    const claims = await verifyAccessToken(token);

    expect(claims).not.toBeNull();
    expect(claims?.sub).toBe(SAMPLE_CLAIMS.sub);
    expect(claims?.username).toBe(SAMPLE_CLAIMS.username);
    expect(claims?.roles).toEqual(SAMPLE_CLAIMS.roles);
    expect(claims?.type).toBe("access");
  });

  it("rejects a tampered token (bit-flipped signature)", async () => {
    const token = await signAccessToken(SAMPLE_CLAIMS);
    const tampered = token.slice(0, -2) + (token.slice(-2) === "aa" ? "bb" : "aa");
    await expect(verifyAccessToken(tampered)).resolves.toBeNull();
  });

  it("rejects a token signed with a different secret", async () => {
    const token = await signAccessToken(SAMPLE_CLAIMS);
    process.env.JWT_ACCESS_SECRET = "a-completely-different-secret-value-000000";
    await expect(verifyAccessToken(token)).resolves.toBeNull();
    process.env.JWT_ACCESS_SECRET = "test-only-secret-do-not-use-in-prod-0123456789";
  });

  it("rejects an expired token", async () => {
    process.env.JWT_ACCESS_TTL_SECONDS = "-1";
    const token = await signAccessToken(SAMPLE_CLAIMS);
    process.env.JWT_ACCESS_TTL_SECONDS = "900";
    await expect(verifyAccessToken(token)).resolves.toBeNull();
  });

  it("rejects garbage input without throwing", async () => {
    await expect(verifyAccessToken("not.a.jwt")).resolves.toBeNull();
  });
});
