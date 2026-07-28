import { UserSession } from '@prisma/client';
import { CreateUserSessionDto, RotateUserSessionDto } from '../../dtos/user-session.dto';

export interface IUserSessionRepository {
  create(data: CreateUserSessionDto): Promise<UserSession>;
  /** Live session (not revoked, not past `expiresAt`) by id. */
  findActiveById(sessionId: string): Promise<UserSession | null>;
  /** Live session whose stored access-token digest matches — used per request by the auth middleware. */
  findActiveByAccessTokenHash(sessionId: string, accessTokenHash: string): Promise<UserSession | null>;
  /** Swaps both digests on an existing row and slides its expiry forward. */
  rotate(sessionId: string, data: RotateUserSessionDto): Promise<UserSession>;
  /** @returns number of rows actually revoked (0 if it was already revoked/absent). */
  revoke(sessionId: string): Promise<number>;
  revokeAllForUser(userId: string, exceptSessionId?: string): Promise<number>;
  listActive(userId: string): Promise<UserSession[]>;
  /** Housekeeping: drops sessions that expired or were revoked before `before`. */
  purge(before: Date): Promise<number>;
}
