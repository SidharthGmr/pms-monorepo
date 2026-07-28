import { IssuedTokens, RotatedTokens, SessionContext, UserSessionDto } from '../../dtos/user-session.dto';
import { AccessTokenClaims } from '../../utils/token.util';

export interface IUserSessionService {
  /** Opens a new session and returns the access/refresh pair bound to it. */
  issue(claims: AccessTokenClaims, context?: SessionContext): Promise<IssuedTokens>;
  /** Single-use refresh: validates, rotates both tokens, and returns the owning user. */
  rotate(refreshToken: string, context?: SessionContext): Promise<RotatedTokens>;
  /** Per-request check that the presented access token still belongs to a live session. */
  validateAccessToken(sessionId: string, accessToken: string): Promise<UserSessionDto | null>;
  revoke(sessionId: string): Promise<boolean>;
  /** Revokes a session only if it belongs to `userId`. */
  revokeForUser(userId: string, sessionId: string): Promise<boolean>;
  revokeAllForUser(userId: string, exceptSessionId?: string): Promise<number>;
  listActive(userId: string, currentSessionId?: string): Promise<UserSessionDto[]>;
  purge(olderThan?: Date): Promise<number>;
}
