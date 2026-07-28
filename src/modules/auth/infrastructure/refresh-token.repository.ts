import { prisma } from "@/lib/db/prisma";
import type { IRefreshTokenRepository } from "../domain/repositories";
import type { TokenRotationResult } from "../domain/entities";

export const refreshTokenRepository: IRefreshTokenRepository = {
  async issue({ userId, tokenHash, family, expiresAt, ipAddress, userAgent }) {
    const rows = await prisma.$queryRaw<{ sp_issue_refresh_token: string }[]>`
      SELECT sp_issue_refresh_token(
        ${userId}::uuid, ${tokenHash}, ${family}, ${expiresAt}, ${ipAddress}, ${userAgent}
      ) as sp_issue_refresh_token
    `;
    return rows[0]!.sp_issue_refresh_token;
  },

  async rotate({ oldTokenHash, newTokenHash, newExpiresAt, ipAddress, userAgent }) {
    const rows = await prisma.$queryRaw<
      {
        user_id: string | null;
        tenant_id: string | null;
        new_token_id: string | null;
        family: string | null;
        status: TokenRotationResult["status"];
      }[]
    >`
      SELECT * FROM sp_rotate_refresh_token(
        ${oldTokenHash}, ${newTokenHash}, ${newExpiresAt}, ${ipAddress}, ${userAgent}
      )
    `;
    const row = rows[0]!;
    return {
      userId: row.user_id,
      tenantId: row.tenant_id,
      newTokenId: row.new_token_id,
      family: row.family,
      status: row.status,
    };
  },

  async revoke(tokenHash, actorUserId, reason) {
    await prisma.$executeRaw`
      SELECT sp_revoke_refresh_token(${tokenHash}, ${actorUserId}::uuid, ${reason})
    `;
  },

  async revokeAllForUser(userId, reason) {
    await prisma.$executeRaw`
      SELECT sp_revoke_all_user_tokens(${userId}::uuid, ${reason})
    `;
  },
};
