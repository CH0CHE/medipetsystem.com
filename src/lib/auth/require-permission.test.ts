import { describe, it, expect, vi, beforeEach } from "vitest";
import { requirePermission } from "./require-permission";
import { ApiError } from "@/lib/http/api-error";
import type { AuthContext } from "./server-session";

vi.mock("@/lib/audit/audit.repository", () => ({
  auditRepository: { write: vi.fn().mockResolvedValue("audit-id") },
}));

const { auditRepository } = await import("@/lib/audit/audit.repository");

function makeContext(overrides: Partial<AuthContext> = {}): AuthContext {
  return {
    userId: "user-1",
    tenantId: null,
    tenantCode: null,
    branchId: null,
    username: "0000001_ADMIN",
    roles: ["ADMINISTRADOR"],
    permissions: [],
    isSuperAdmin: false,
    isSupportAccount: false,
    mustChangePassword: false,
    ...overrides,
  };
}

const request = new Request("http://localhost/api/platform-admin/tenants");

describe("requirePermission", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("passes silently when the context has the required permission", async () => {
    const ctx = makeContext({ permissions: ["platform_admin.tenants.view"] });
    await expect(requirePermission(ctx, "platform_admin.tenants.view", request)).resolves.toBeUndefined();
    expect(auditRepository.write).not.toHaveBeenCalled();
  });

  it("passes for a Super Admin regardless of the explicit permissions list", async () => {
    const ctx = makeContext({ isSuperAdmin: true, permissions: [] });
    await expect(requirePermission(ctx, "platform_admin.tenants.create", request)).resolves.toBeUndefined();
    expect(auditRepository.write).not.toHaveBeenCalled();
  });

  it("throws a 403 ApiError and audits the denial when the permission is missing", async () => {
    const ctx = makeContext({ permissions: [] });

    await expect(requirePermission(ctx, "platform_admin.tenants.create", request)).rejects.toMatchObject({
      status: 403,
    });

    expect(auditRepository.write).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "ACCESS_DENIED",
        userId: ctx.userId,
        metadata: expect.objectContaining({ requiredPermission: "platform_admin.tenants.create" }),
      }),
    );
  });

  it("throws an instance of ApiError specifically", async () => {
    const ctx = makeContext({ permissions: [] });
    await expect(requirePermission(ctx, "x.y.z", request)).rejects.toBeInstanceOf(ApiError);
  });
});
