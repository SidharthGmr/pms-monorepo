import { randomBytes } from 'crypto';
import env from '../config/env';

/**
 * Public document links are unguessable rather than access-controlled: the recipient has no
 * account, so the token in the URL *is* the credential. 24 random bytes (192 bits) is far
 * past brute force, and the number itself is never usable as a key because estimate and
 * order numbers are sequential.
 */
export function generateShareToken(): string {
  return randomBytes(24).toString('base64url');
}

export function buildShareUrl(kind: 'estimate' | 'order', token: string): string {
  const base = (env.APP_PUBLIC_URL || '').replace(/\/$/, '');
  return `${base}/share/${kind}/${token}`;
}
