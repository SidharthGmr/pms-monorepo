import { IssuedTokens, RotatedTokens, SessionContext, UserSessionDto } from '../../dtos/user-session.dto';
import { AccessTokenClaims } from '../../utils/token.util';

export interface IUserSessionService {
  issue(claims: AccessTokenClaims, context?: SessionContext): Promise<IssuedTokens>;
  rotate(refreshToken: string, context?: SessionContext): Promise<RotatedTokens>;
  validateAccessToken(sessionId: string, accessToken: string): Promise<UserSessionDto | null>;
  revoke(sessionId: string): Promise<boolean>;
  revokeForUser(userId: string, sessionId: string): Promise<boolean>;
  revokeAllForUser(userId: string, exceptSessionId?: string): Promise<number>;
  listActive(userId: string, currentSessionId?: string): Promise<UserSessionDto[]>;
  purge(olderThan?: Date): Promise<number>;
}
