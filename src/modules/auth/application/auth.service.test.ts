// @vitest-environment node
// jose's internal `instanceof Uint8Array` checks (used by signAccessToken) fail
// under jsdom's cross-realm globals — this suite needs the plain Node environment.
import { describe, it, expect, beforeAll, vi } from "vitest";
import { AuthService } from "./auth.service";
import { hashPassword } from "@/lib/security/password.service";
import type { IAuthRepository, IRefreshTokenRepository } from "../domain/repositories";
import type { LoginContext } from "../domain/entities";
import {
  AccountLockedError,
  InvalidCredentialsError,
  InvalidRefreshTokenError,
  RateLimitedError,
  TenantSuspendedError,
  TokenReuseDetectedError,
  WrongPortalError,
} from "../domain/errors";

const REAL_PASSWORD = "Correcta$123";
let REAL_HASH: string;
let REAL_SALT: string;

beforeAll(async () => {
  process.env.JWT_ACCESS_SECRET = "test-only-secret-do-not-use-in-prod-0123456789";
  const hashed = await hashPassword(REAL_PASSWORD);
  REAL_HASH = hashed.hash;
  REAL_SALT = hashed.salt;
});

function baseContext(overrides: Partial<LoginContext> = {}): LoginContext {
  return {
    userId: "user-1",
    tenantId: "tenant-1",
    branchId: "branch-1",
    username: "0000001_ADMIN",
    passwordHash: REAL_HASH,
    passwordSalt: REAL_SALT,
    mustChangePassword: false,
    userStatus: "ACTIVE",
    failedLoginAttempts: 0,
    lockedUntil: null,
    isSuperAdmin: false,
    isSupportAccount: false,
    tenantStatus: "ACTIVE",
    tenantName: "Clínica ABC",
    tenantCode: "0000001",
    branchName: "Central",
    roles: ["ADMINISTRADOR"],
    permissions: [],
    ...overrides,
  };
}

function makeAuthRepoMock(context: LoginContext | null): IAuthRepository {
  return {
    checkIpRateLimit: vi.fn().mockResolvedValue({ allowed: true, attemptsInWindow: 0 }),
    getLoginContext: vi.fn().mockResolvedValue(context),
    recordLoginResult: vi.fn().mockResolvedValue({ lockedUntil: null }),
    getSessionContext: vi.fn().mockResolvedValue(
      context && {
        userId: context.userId,
        tenantId: context.tenantId,
        branchId: context.branchId,
        username: context.username,
        mustChangePassword: context.mustChangePassword,
        userStatus: context.userStatus,
        isSuperAdmin: context.isSuperAdmin,
        isSupportAccount: context.isSupportAccount,
        tenantStatus: context.tenantStatus,
        tenantName: context.tenantName,
        tenantCode: context.tenantCode,
        branchName: context.branchName,
        roles: context.roles,
        permissions: context.permissions,
      },
    ),
    updateUserPassword: vi.fn().mockResolvedValue(undefined),
  };
}

function makeRefreshRepoMock(): IRefreshTokenRepository {
  return {
    issue: vi.fn().mockResolvedValue("token-row-id"),
    rotate: vi.fn(),
    revoke: vi.fn().mockResolvedValue(undefined),
    revokeAllForUser: vi.fn().mockResolvedValue(undefined),
  };
}

const META = { ipAddress: "127.0.0.1", userAgent: "vitest" };

describe("AuthService.login", () => {
  it("succeeds with correct credentials and issues tokens", async () => {
    const context = baseContext();
    const authRepo = makeAuthRepoMock(context);
    const refreshRepo = makeRefreshRepoMock();
    const service = new AuthService(authRepo, refreshRepo);

    const result = await service.login({ username: context.username, password: REAL_PASSWORD }, "tenant", META);

    expect(result.accessToken).toBeTruthy();
    expect(result.refreshToken).toBeTruthy();
    expect(authRepo.recordLoginResult).toHaveBeenCalledWith(
      expect.objectContaining({ userId: context.userId, success: true }),
    );
    expect(refreshRepo.issue).toHaveBeenCalledOnce();
  });

  it("rejects an incorrect password and records the failed attempt", async () => {
    const context = baseContext();
    const authRepo = makeAuthRepoMock(context);
    const service = new AuthService(authRepo, makeRefreshRepoMock());

    await expect(
      service.login({ username: context.username, password: "wrong-password" }, "tenant", META),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);

    expect(authRepo.recordLoginResult).toHaveBeenCalledWith(
      expect.objectContaining({ userId: context.userId, success: false }),
    );
  });

  it("rejects an unknown username without revealing existence, still audits the attempt", async () => {
    const authRepo = makeAuthRepoMock(null);
    const service = new AuthService(authRepo, makeRefreshRepoMock());

    await expect(
      service.login({ username: "no-such-user", password: "whatever123" }, "tenant", META),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);

    expect(authRepo.recordLoginResult).toHaveBeenCalledWith(
      expect.objectContaining({ userId: null, usernameAttempted: "no-such-user", success: false }),
    );
  });

  it("rejects when the account is locked", async () => {
    const context = baseContext({ lockedUntil: new Date(Date.now() + 60_000) });
    const authRepo = makeAuthRepoMock(context);
    const service = new AuthService(authRepo, makeRefreshRepoMock());

    await expect(
      service.login({ username: context.username, password: REAL_PASSWORD }, "tenant", META),
    ).rejects.toBeInstanceOf(AccountLockedError);
  });

  it("rejects when the tenant is suspended", async () => {
    const context = baseContext({ tenantStatus: "SUSPENDED" });
    const authRepo = makeAuthRepoMock(context);
    const service = new AuthService(authRepo, makeRefreshRepoMock());

    await expect(
      service.login({ username: context.username, password: REAL_PASSWORD }, "tenant", META),
    ).rejects.toBeInstanceOf(TenantSuspendedError);
  });

  it("rejects a Super Admin account on the tenant login portal", async () => {
    const context = baseContext({ isSuperAdmin: true, tenantId: null, tenantStatus: null });
    const authRepo = makeAuthRepoMock(context);
    const service = new AuthService(authRepo, makeRefreshRepoMock());

    await expect(
      service.login({ username: context.username, password: REAL_PASSWORD }, "tenant", META),
    ).rejects.toBeInstanceOf(WrongPortalError);
  });

  it("rejects a support (CONECTOR) account on the tenant login portal", async () => {
    const context = baseContext({ isSupportAccount: true });
    const authRepo = makeAuthRepoMock(context);
    const service = new AuthService(authRepo, makeRefreshRepoMock());

    await expect(
      service.login({ username: context.username, password: REAL_PASSWORD }, "tenant", META),
    ).rejects.toBeInstanceOf(WrongPortalError);
  });

  it("rejects a non-super-admin on the platform-admin portal", async () => {
    const context = baseContext();
    const authRepo = makeAuthRepoMock(context);
    const service = new AuthService(authRepo, makeRefreshRepoMock());

    await expect(
      service.login({ username: context.username, password: REAL_PASSWORD }, "platform-admin", META),
    ).rejects.toBeInstanceOf(WrongPortalError);
  });

  it("rejects login attempts once the per-IP rate limit is exceeded", async () => {
    const context = baseContext();
    const authRepo = makeAuthRepoMock(context);
    authRepo.checkIpRateLimit = vi.fn().mockResolvedValue({ allowed: false, attemptsInWindow: 99 });
    const service = new AuthService(authRepo, makeRefreshRepoMock());

    await expect(
      service.login({ username: context.username, password: REAL_PASSWORD }, "tenant", META),
    ).rejects.toBeInstanceOf(RateLimitedError);
    expect(authRepo.getLoginContext).not.toHaveBeenCalled();
  });
});

describe("AuthService.refresh", () => {
  it("returns new tokens on a successful rotation", async () => {
    const context = baseContext();
    const authRepo = makeAuthRepoMock(context);
    const refreshRepo = makeRefreshRepoMock();
    refreshRepo.rotate = vi.fn().mockResolvedValue({
      userId: context.userId,
      tenantId: context.tenantId,
      newTokenId: "new-id",
      family: "family-1",
      status: "rotated",
    });
    const service = new AuthService(authRepo, refreshRepo);

    const result = await service.refresh("some-raw-refresh-token", META);
    expect(result.accessToken).toBeTruthy();
    expect(result.refreshToken).toBeTruthy();
  });

  it("throws TokenReuseDetectedError when the SP reports token reuse", async () => {
    const refreshRepo = makeRefreshRepoMock();
    refreshRepo.rotate = vi.fn().mockResolvedValue({
      userId: null,
      tenantId: null,
      newTokenId: null,
      family: null,
      status: "reused_detected",
    });
    const service = new AuthService(makeAuthRepoMock(baseContext()), refreshRepo);

    await expect(service.refresh("stolen-token", META)).rejects.toBeInstanceOf(TokenReuseDetectedError);
  });

  it("throws InvalidRefreshTokenError for an invalid or expired token", async () => {
    const refreshRepo = makeRefreshRepoMock();
    refreshRepo.rotate = vi.fn().mockResolvedValue({
      userId: null,
      tenantId: null,
      newTokenId: null,
      family: null,
      status: "invalid",
    });
    const service = new AuthService(makeAuthRepoMock(baseContext()), refreshRepo);

    await expect(service.refresh("bogus-token", META)).rejects.toBeInstanceOf(InvalidRefreshTokenError);
  });
});
