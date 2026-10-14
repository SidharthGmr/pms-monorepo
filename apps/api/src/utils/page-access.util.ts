import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import config from '../config';

/**
 * Access tokens for gated CMS pages, signed with the same key and issuer as the auth
 * tokens but a distinct `type`, so neither kind can stand in for the other.
 *
 * Two grants exist: an unlock token names the page it opened (`pageId`, issued after the
 * right password), and a form token names the public form that was submitted (`form`),
 * which opens every page conditioned on that form. Both expire on their own - nothing is
 * persisted server-side.
 */

const PAGE_ACCESS_TYPE = 'page-access';
const PAGE_ACCESS_EXPIRES = '12h';

export interface PageAccessClaims {
  pageId?: number | undefined;
  form?: string | undefined;
}

const sign = (claims: PageAccessClaims): string =>
  jwt.sign({ ...claims, type: PAGE_ACCESS_TYPE, jti: crypto.randomUUID() }, config.jwt.secret, {
    expiresIn: PAGE_ACCESS_EXPIRES,
    algorithm: 'HS256',
    audience: config.jwt.audience,
    issuer: config.jwt.issuer,
  });

export const signPageUnlockToken = (pageId: number): string => sign({ pageId });

export const signFormSubmissionToken = (form: 'contact' | 'subscribe'): string => sign({ form });

/** Returns the claims of a valid page-access token, or null for anything else. */
export const verifyPageAccessToken = (token: string | undefined): PageAccessClaims | null => {
  if (!token) return null;
  try {
    const payload = jwt.verify(token, config.jwt.secret, {
      algorithms: ['HS256'],
      audience: config.jwt.audience,
      issuer: config.jwt.issuer,
    }) as jwt.JwtPayload;
    if (payload['type'] !== PAGE_ACCESS_TYPE) return null;
    return { pageId: payload['pageId'] as number | undefined, form: payload['form'] as string | undefined };
  } catch {
    return null;
  }
};
