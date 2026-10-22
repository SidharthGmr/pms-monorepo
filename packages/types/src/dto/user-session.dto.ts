import { UserDto } from './user.dto';

/** A session as exposed to clients - token hashes are deliberately never included. */
export interface UserSessionDto {
  id: string;
  userId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  expiresAt: Date | string;
  revokedAt?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  /** True for the session the current request is authenticated with. */
  isCurrent?: boolean;
}

export interface CreateUserSessionDto {
  id: string;
  userId: string;
  accessTokenHash: string;
  refreshTokenHash: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  expiresAt: Date;
}

export interface RotateUserSessionDto {
  accessTokenHash: string;
  refreshTokenHash: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  expiresAt: Date;
}

/** Where the session is being created/rotated from, recorded for audit. */
export interface SessionContext {
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface IssuedTokens {
  sessionId: string;
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
}

export interface RotatedTokens extends IssuedTokens {
  user: UserDto;
}
