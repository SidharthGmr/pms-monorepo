import { UserSession } from '@prisma/client';
import prisma from '../config/prisma';
import { CreateUserSessionDto, RotateUserSessionDto } from '../dtos/user-session.dto';
import { IUserSessionRepository } from './interfaces/iuser-session.repository';

export class UserSessionRepository implements IUserSessionRepository {
  async create(data: CreateUserSessionDto): Promise<UserSession> {
    return prisma.userSession.create({
      data: {
        id: data.id,
        userId: data.userId,
        accessTokenHash: data.accessTokenHash,
        refreshTokenHash: data.refreshTokenHash,
        ipAddress: data.ipAddress ?? null,
        userAgent: data.userAgent ?? null,
        expiresAt: data.expiresAt,
      },
    });
  }

  async findActiveById(sessionId: string): Promise<UserSession | null> {
    return prisma.userSession.findFirst({
      where: {
        id: sessionId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
  }

  async findActiveByAccessTokenHash(sessionId: string, accessTokenHash: string): Promise<UserSession | null> {
    return prisma.userSession.findFirst({
      where: {
        id: sessionId,
        accessTokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
  }

  async rotate(sessionId: string, data: RotateUserSessionDto): Promise<UserSession> {
    return prisma.userSession.update({
      where: { id: sessionId },
      data: {
        accessTokenHash: data.accessTokenHash,
        refreshTokenHash: data.refreshTokenHash,
        // Keep whatever was recorded at login when the caller has nothing better.
        ...(data.ipAddress ? { ipAddress: data.ipAddress } : {}),
        ...(data.userAgent ? { userAgent: data.userAgent } : {}),
        expiresAt: data.expiresAt,
      },
    });
  }

  async revoke(sessionId: string): Promise<number> {
    // updateMany (not update) so revoking an already-revoked or unknown session
    // is a no-op returning 0 rather than throwing.
    const { count } = await prisma.userSession.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return count;
  }

  async revokeAllForUser(userId: string, exceptSessionId?: string): Promise<number> {
    const { count } = await prisma.userSession.updateMany({
      where: {
        userId,
        revokedAt: null,
        ...(exceptSessionId ? { id: { not: exceptSessionId } } : {}),
      },
      data: { revokedAt: new Date() },
    });
    return count;
  }

  async listActive(userId: string): Promise<UserSession[]> {
    return prisma.userSession.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async purge(before: Date): Promise<number> {
    const { count } = await prisma.userSession.deleteMany({
      where: {
        OR: [{ expiresAt: { lt: before } }, { revokedAt: { lt: before } }],
      },
    });
    return count;
  }
}

export default UserSessionRepository;
