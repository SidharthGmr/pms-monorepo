import { UserSession } from '@prisma/client';
import { inject, injectable } from 'inversify';
import { TYPES } from '../config/ioc.types';
import { IssuedTokens, RotatedTokens, SessionContext, UserSessionDto } from '../dtos/user-session.dto';
import CustomError from '../exceptions/custom-error';
import IUnitOfWork from '../repository/interfaces/iunitofwork.repository';
import {
  AccessTokenClaims,
  hashToken,
  newSessionId,
  REFRESH_TOKEN_TYPE,
  signAccessToken,
  signRefreshToken,
  tokenExpiryDate,
  verifySessionToken,
} from '../utils/token.util';
import { IUserSessionService } from './interfaces/Iuser-session.service';

/** `ipAddress` is VarChar(64) in the schema; long forwarded chains must not blow the insert up. */
const IP_MAX_LENGTH = 64;

@injectable()
export class UserSessionService implements IUserSessionService {
  constructor(@inject(TYPES.IUnitOfWork) private unitOfWork: IUnitOfWork) {}

  async issue(claims: AccessTokenClaims, context: SessionContext = {}): Promise<IssuedTokens> {
    const sessionId = newSessionId();
    const accessToken = signAccessToken(claims, sessionId);
    const refreshToken = signRefreshToken(claims.userId, sessionId);
    // The session lives exactly as long as its refresh token.
    const refreshTokenExpiresAt = tokenExpiryDate(refreshToken);

    await this.unitOfWork.UserSession.create({
      id: sessionId,
      userId: claims.userId,
      accessTokenHash: hashToken(accessToken),
      refreshTokenHash: hashToken(refreshToken),
      ipAddress: context.ipAddress?.slice(0, IP_MAX_LENGTH) ?? null,
      userAgent: context.userAgent ?? null,
      expiresAt: refreshTokenExpiresAt,
    });

    return {
      sessionId,
      accessToken,
      refreshToken,
      accessTokenExpiresAt: tokenExpiryDate(accessToken),
      refreshTokenExpiresAt,
    };
  }

  async rotate(refreshToken: string, context: SessionContext = {}): Promise<RotatedTokens> {
    let payload;
    try {
      payload = verifySessionToken(refreshToken);
    } catch {
      throw new CustomError('Invalid or expired refresh token', 401);
    }

    // An access token must never be accepted here, hence the explicit type claim.
    if (payload.type !== REFRESH_TOKEN_TYPE) {
      throw new CustomError('Invalid refresh token', 401);
    }

    const sessionId = payload.sid;
    const userId = payload.userId;
    if (!sessionId || !userId) {
      throw new CustomError('Invalid refresh token', 401);
    }

    const session = await this.unitOfWork.UserSession.findActiveById(sessionId);
    if (!session || session.userId !== userId) {
      throw new CustomError('Session is no longer active. Please login again.', 401);
    }

    // Refresh tokens are single-use. A valid-but-superseded token means the token
    // leaked or was replayed, so the whole session dies rather than being rotated.
    if (!session.refreshTokenHash || session.refreshTokenHash !== hashToken(refreshToken)) {
      await this.unitOfWork.UserSession.revoke(sessionId);
      throw new CustomError('Refresh token has already been used. Please login again.', 401);
    }

    const user = await this.unitOfWork.User.findById(userId);
    if (!user) {
      await this.unitOfWork.UserSession.revoke(sessionId);
      throw new CustomError('User not found', 404);
    }

    if (!user.isActive) {
      await this.unitOfWork.UserSession.revoke(sessionId);
      throw new CustomError('Your account has been deactivated. Please contact an administrator.', 403);
    }

    const claims: AccessTokenClaims = {
      id: user.id,
      userId: user.userId,
      name: user.name,
      email: user.email,
      role: user.role,
      storeCode: user.storeCode ?? null,
    };

    const newAccessToken = signAccessToken(claims, sessionId);
    const newRefreshToken = signRefreshToken(user.userId, sessionId);
    const refreshTokenExpiresAt = tokenExpiryDate(newRefreshToken);

    await this.unitOfWork.UserSession.rotate(sessionId, {
      accessTokenHash: hashToken(newAccessToken),
      refreshTokenHash: hashToken(newRefreshToken),
      ipAddress: context.ipAddress?.slice(0, IP_MAX_LENGTH) ?? null,
      userAgent: context.userAgent ?? null,
      expiresAt: refreshTokenExpiresAt,
    });

    return {
      sessionId,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      accessTokenExpiresAt: tokenExpiryDate(newAccessToken),
      refreshTokenExpiresAt,
      user,
    };
  }

  async validateAccessToken(sessionId: string, accessToken: string): Promise<UserSessionDto | null> {
    const session = await this.unitOfWork.UserSession.findActiveByAccessTokenHash(sessionId, hashToken(accessToken));
    return session ? this.convertToDto(session) : null;
  }

  async revoke(sessionId: string): Promise<boolean> {
    const count = await this.unitOfWork.UserSession.revoke(sessionId);
    return count > 0;
  }

  async revokeForUser(userId: string, sessionId: string): Promise<boolean> {
    const session = await this.unitOfWork.UserSession.findActiveById(sessionId);
    if (!session || session.userId !== userId) {
      return false;
    }
    return this.revoke(sessionId);
  }

  async revokeAllForUser(userId: string, exceptSessionId?: string): Promise<number> {
    return this.unitOfWork.UserSession.revokeAllForUser(userId, exceptSessionId);
  }

  async listActive(userId: string, currentSessionId?: string): Promise<UserSessionDto[]> {
    const sessions = await this.unitOfWork.UserSession.listActive(userId);
    return sessions.map((session) => this.convertToDto(session, currentSessionId));
  }

  async purge(olderThan: Date = new Date()): Promise<number> {
    return this.unitOfWork.UserSession.purge(olderThan);
  }

  private convertToDto(session: UserSession, currentSessionId?: string): UserSessionDto {
    // Token hashes stay server-side — they are credentials-equivalent for lookup.
    return {
      id: session.id,
      userId: session.userId,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      expiresAt: session.expiresAt,
      revokedAt: session.revokedAt,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      ...(currentSessionId ? { isCurrent: session.id === currentSessionId } : {}),
    };
  }
}

export default UserSessionService;
