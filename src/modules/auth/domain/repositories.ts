import type { LoginContext, SessionContext, TokenRotationResult } from "./entities";

export interface IAuthRepository {
  checkIpRateLimit(
    ipAddress: string,
    windowMinutes: number,
    maxAttempts: number,
  ): Promise<{ allowed: boolean; attemptsInWindow: number }>;

  getLoginContext(username: string): Promise<LoginContext | null>;

  recordLoginResult(input: {
    userId: string | null;
    usernameAttempted: string;
    success: boolean;
    ipAddress: string;
    userAgent: string;
    maxAttempts: number;
    lockMinutes: number;
  }): Promise<{ lockedUntil: Date | null }>;

  getSessionContext(userId: string): Promise<SessionContext | null>;

  updateUserPassword(userId: string, newPasswordHash: string, newPasswordSalt: string): Promise<void>;
}

export interface IRefreshTokenRepository {
  issue(input: {
    userId: string;
    tokenHash: string;
    family: string;
    expiresAt: Date;
    ipAddress: string;
    userAgent: string;
  }): Promise<string>;

  rotate(input: {
    oldTokenHash: string;
    newTokenHash: string;
    newExpiresAt: Date;
    ipAddress: string;
    userAgent: string;
  }): Promise<TokenRotationResult>;

  revoke(tokenHash: string, actorUserId: string | null, reason: string): Promise<void>;

  revokeAllForUser(userId: string, reason: string): Promise<void>;
}
