export interface LoginContext {
  userId: string;
  tenantId: string | null;
  branchId: string | null;
  username: string;
  passwordHash: string;
  passwordSalt: string;
  mustChangePassword: boolean;
  userStatus: "ACTIVE" | "DISABLED" | "LOCKED";
  failedLoginAttempts: number;
  lockedUntil: Date | null;
  isSuperAdmin: boolean;
  isSupportAccount: boolean;
  tenantStatus: "ACTIVE" | "SUSPENDED" | null;
  tenantName: string | null;
  tenantCode: string | null;
  branchName: string | null;
  roles: string[];
  permissions: string[];
}

export interface SessionContext {
  userId: string;
  tenantId: string | null;
  branchId: string | null;
  username: string;
  mustChangePassword: boolean;
  userStatus: "ACTIVE" | "DISABLED" | "LOCKED";
  isSuperAdmin: boolean;
  isSupportAccount: boolean;
  tenantStatus: "ACTIVE" | "SUSPENDED" | null;
  tenantName: string | null;
  tenantCode: string | null;
  branchName: string | null;
  roles: string[];
  permissions: string[];
}

export type TokenRotationStatus = "rotated" | "reused_detected" | "invalid" | "expired";

export interface TokenRotationResult {
  userId: string | null;
  tenantId: string | null;
  newTokenId: string | null;
  family: string | null;
  status: TokenRotationStatus;
}

export type AuthPortal = "tenant" | "platform-admin";
