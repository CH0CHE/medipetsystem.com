import { hashPassword, verifyPassword } from "@/lib/security/password.service";
import {
  signAccessToken,
  verifyAccessToken,
  refreshTokenExpiresAt,
  type AccessTokenClaimsData,
} from "@/lib/auth/token.service";
import {
  generateOpaqueRefreshToken,
  hashRefreshToken,
  generateTokenFamily,
} from "@/lib/auth/refresh-token.util";
import type { IAuthRepository, IRefreshTokenRepository } from "../domain/repositories";
import type { AuthPortal, LoginContext, SessionContext } from "../domain/entities";
import {
  AccountDisabledError,
  AccountLockedError,
  InvalidCredentialsError,
  InvalidRefreshTokenError,
  RateLimitedError,
  TenantCancelledError,
  TenantSuspendedError,
  TokenReuseDetectedError,
  WrongPortalError,
} from "../domain/errors";

const LOGIN_MAX_ATTEMPTS_PER_USERNAME = Number(process.env.LOGIN_MAX_ATTEMPTS_PER_USERNAME ?? 5);
const LOGIN_LOCK_MINUTES = Number(process.env.LOGIN_LOCK_MINUTES ?? 15);
const LOGIN_MAX_ATTEMPTS_PER_IP = Number(process.env.LOGIN_MAX_ATTEMPTS_PER_IP ?? 20);
const LOGIN_IP_WINDOW_MINUTES = Number(process.env.LOGIN_IP_WINDOW_MINUTES ?? 15);

// Hash Argon2id "señuelo" para mantener un tiempo de respuesta constante cuando el
// username no existe — evita que la latencia revele qué usuarios sí existen.
let dummyHashPromise: Promise<string> | null = null;
function getDummyHash(): Promise<string> {
  if (!dummyHashPromise) {
    dummyHashPromise = hashPassword("no-such-user-constant-time-decoy-000").then((r) => r.hash);
  }
  return dummyHashPromise;
}

export interface RequestMeta {
  ipAddress: string;
  userAgent: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResult extends AuthTokens {
  context: LoginContext;
}

function assertPortalMatch(context: LoginContext, portal: AuthPortal) {
  const isStaffAccount = context.isSuperAdmin || context.isSupportAccount;
  if (portal === "tenant" && isStaffAccount) {
    throw new WrongPortalError();
  }
  if (portal === "platform-admin" && !context.isSuperAdmin) {
    throw new WrongPortalError();
  }
}

function buildClaims(context: { userId: string; tenantId: string | null; tenantCode: string | null; branchId: string | null; username: string; roles: string[]; permissions: string[]; isSuperAdmin: boolean; isSupportAccount: boolean; mustChangePassword: boolean }) {
  return {
    sub: context.userId,
    tenantId: context.tenantId,
    tenantCode: context.tenantCode,
    branchId: context.branchId,
    username: context.username,
    roles: context.roles,
    permissions: context.permissions,
    isSuperAdmin: context.isSuperAdmin,
    isSupportAccount: context.isSupportAccount,
    mustChangePassword: context.mustChangePassword,
  } satisfies AccessTokenClaimsData;
}

export class AuthService {
  constructor(
    private readonly authRepository: IAuthRepository,
    private readonly refreshTokenRepository: IRefreshTokenRepository,
  ) {}

  async login(
    input: { username: string; password: string },
    portal: AuthPortal,
    meta: RequestMeta,
  ): Promise<LoginResult> {
    const ipCheck = await this.authRepository.checkIpRateLimit(
      meta.ipAddress,
      LOGIN_IP_WINDOW_MINUTES,
      LOGIN_MAX_ATTEMPTS_PER_IP,
    );
    if (!ipCheck.allowed) {
      throw new RateLimitedError();
    }

    const context = await this.authRepository.getLoginContext(input.username);

    if (!context) {
      await verifyPassword(await getDummyHash(), input.password);
      await this.authRepository.recordLoginResult({
        userId: null,
        usernameAttempted: input.username,
        success: false,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
        maxAttempts: LOGIN_MAX_ATTEMPTS_PER_USERNAME,
        lockMinutes: LOGIN_LOCK_MINUTES,
      });
      throw new InvalidCredentialsError();
    }

    assertPortalMatch(context, portal);

    if (context.tenantId && context.tenantStatus === "SUSPENDED") {
      throw new TenantSuspendedError();
    }

    if (context.tenantId && context.tenantStatus === "CANCELADA") {
      throw new TenantCancelledError();
    }

    if (context.userStatus === "DISABLED") {
      throw new AccountDisabledError();
    }

    if (context.userStatus === "LOCKED" || (context.lockedUntil && context.lockedUntil > new Date())) {
      throw new AccountLockedError(context.lockedUntil ?? new Date());
    }

    const passwordValid = await verifyPassword(context.passwordHash, input.password);

    if (!passwordValid) {
      const result = await this.authRepository.recordLoginResult({
        userId: context.userId,
        usernameAttempted: input.username,
        success: false,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
        maxAttempts: LOGIN_MAX_ATTEMPTS_PER_USERNAME,
        lockMinutes: LOGIN_LOCK_MINUTES,
      });
      if (result.lockedUntil) {
        throw new AccountLockedError(result.lockedUntil);
      }
      throw new InvalidCredentialsError();
    }

    await this.authRepository.recordLoginResult({
      userId: context.userId,
      usernameAttempted: input.username,
      success: true,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      maxAttempts: LOGIN_MAX_ATTEMPTS_PER_USERNAME,
      lockMinutes: LOGIN_LOCK_MINUTES,
    });

    const tokens = await this.issueTokens(buildClaims(context), meta);
    return { ...tokens, context };
  }

  private async issueTokens(
    claims: AccessTokenClaimsData,
    meta: RequestMeta,
  ): Promise<AuthTokens> {
    const accessToken = await signAccessToken(claims);
    const rawRefreshToken = generateOpaqueRefreshToken();
    const family = generateTokenFamily();

    await this.refreshTokenRepository.issue({
      userId: claims.sub,
      tokenHash: hashRefreshToken(rawRefreshToken),
      family,
      expiresAt: refreshTokenExpiresAt(),
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return { accessToken, refreshToken: rawRefreshToken };
  }

  async refresh(rawRefreshToken: string, meta: RequestMeta): Promise<AuthTokens> {
    const newRawToken = generateOpaqueRefreshToken();

    const result = await this.refreshTokenRepository.rotate({
      oldTokenHash: hashRefreshToken(rawRefreshToken),
      newTokenHash: hashRefreshToken(newRawToken),
      newExpiresAt: refreshTokenExpiresAt(),
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    if (result.status === "reused_detected") {
      throw new TokenReuseDetectedError();
    }
    if (result.status !== "rotated" || !result.userId) {
      throw new InvalidRefreshTokenError();
    }

    const session = await this.authRepository.getSessionContext(result.userId);
    if (
      !session ||
      session.userStatus !== "ACTIVE" ||
      (session.tenantId && (session.tenantStatus === "SUSPENDED" || session.tenantStatus === "CANCELADA"))
    ) {
      throw new InvalidRefreshTokenError();
    }

    const accessToken = await signAccessToken(buildClaims(session));
    return { accessToken, refreshToken: newRawToken };
  }

  async logout(rawRefreshToken: string | undefined, actorUserId: string | null): Promise<void> {
    if (!rawRefreshToken) return;
    await this.refreshTokenRepository.revoke(hashRefreshToken(rawRefreshToken), actorUserId, "USER_LOGOUT");
  }

  async getSessionContext(userId: string): Promise<SessionContext | null> {
    return this.authRepository.getSessionContext(userId);
  }

  async changePassword(
    userId: string,
    input: { currentPassword: string; newPassword: string },
    meta: RequestMeta,
  ): Promise<AuthTokens> {
    const session = await this.authRepository.getSessionContext(userId);
    if (!session) throw new InvalidCredentialsError();

    const loginContext = await this.authRepository.getLoginContext(session.username);
    if (!loginContext) throw new InvalidCredentialsError();

    const currentValid = await verifyPassword(loginContext.passwordHash, input.currentPassword);
    if (!currentValid) throw new InvalidCredentialsError();

    const { hash, salt } = await hashPassword(input.newPassword);
    await this.authRepository.updateUserPassword(userId, hash, salt);
    await this.refreshTokenRepository.revokeAllForUser(userId, "PASSWORD_CHANGED");

    return this.issueTokens(
      buildClaims({ ...session, mustChangePassword: false }),
      meta,
    );
  }

  async verifyAccessTokenClaims(token: string) {
    return verifyAccessToken(token);
  }
}
