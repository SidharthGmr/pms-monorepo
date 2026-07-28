import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import config from '../config';

/**
 * Token helpers shared by login, refresh and the authentication middleware.
 *
 * Two things matter here:
 *  - every token carries a `sid` (UserSession id) and a `type`, so an access token
 *    can never be replayed as a refresh token (and vice versa);
 *  - only SHA-256 digests of tokens are ever persisted, so a dump of `UserSession`
 *    does not hand an attacker usable credentials.
 */

export const ACCESS_TOKEN_TYPE = 'access';
export const REFRESH_TOKEN_TYPE = 'refresh';

export interface AccessTokenClaims {
  id: number;
  userId: string;
  name: string;
  email: string;
  role: string;
  storeCode: string | null;
}

export interface SessionTokenPayload extends jwt.JwtPayload {
  sid?: string;
  type?: string;
  userId?: string;
}

/** Digests are 64 hex chars, well inside the VarChar(255) hash columns. */
export const hashToken = (token: string): string => crypto.createHash('sha256').update(token).digest('hex');

export const newSessionId = (): string => crypto.randomUUID();

const sign = (payload: Record<string, unknown>, expiresIn: string): string =>
  jwt.sign(
    // `jti` keeps two tokens signed in the same second from colliding, which the
    // unique hash columns on UserSession would otherwise reject.
    { ...payload, jti: crypto.randomUUID() },
    config.jwt.secret,
    {
      expiresIn: expiresIn as any,
      algorithm: 'HS256',
      audience: config.jwt.audience,
      issuer: config.jwt.issuer,
    }
  );

export const signAccessToken = (claims: AccessTokenClaims, sessionId: string): string =>
  sign({ ...claims, sid: sessionId, type: ACCESS_TOKEN_TYPE }, config.jwt.accessExpires);

export const signRefreshToken = (userId: string, sessionId: string): string =>
  sign({ userId, sid: sessionId, type: REFRESH_TOKEN_TYPE }, config.jwt.refreshExpires);

/** Throws if the token is malformed, expired, or signed with another key. */
export const verifySessionToken = (token: string): SessionTokenPayload =>
  jwt.verify(token, config.jwt.secret, {
    algorithms: ['HS256'],
    audience: config.jwt.audience || undefined,
    issuer: config.jwt.issuer || undefined,
  }) as SessionTokenPayload;

/** `exp` is seconds since the epoch; UserSession.expiresAt needs a Date. */
export const tokenExpiryDate = (token: string): Date => {
  const decoded = jwt.decode(token) as jwt.JwtPayload | null;
  if (!decoded?.exp) {
    throw new Error('Signed token is missing an expiry claim');
  }
  return new Date(decoded.exp * 1000);
};

/** Best-effort client IP: the first hop in x-forwarded-for, else the socket address. */
export const clientIpAddress = (forwardedFor: string | string[] | undefined, fallback: string | undefined): string | null => {
  const header = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
  const forwarded = header?.split(',')[0]?.trim();
  return forwarded || fallback || null;
};
