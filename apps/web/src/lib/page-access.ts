/**
 * Cookie plumbing for gated CMS pages. The API issues short-lived signed tokens - after a
 * correct page password, or after a public form submission - and the server-rendered page
 * route forwards them in the x-page-access header. Cookies (not query strings) carry them so
 * the gate stays server-side and survives a reload.
 */

const MAX_AGE_SECONDS = 12 * 60 * 60; // matches the token's 12h expiry

export const FORM_ACCESS_COOKIE = 'pms-form-access';

export const pageAccessCookie = (slug: string) => `pms-page-access-${slug}`;

export const storeAccessCookie = (name: string, token: string): void => {
  document.cookie = `${name}=${encodeURIComponent(token)}; path=/; max-age=${MAX_AGE_SECONDS}; samesite=lax`;
};
