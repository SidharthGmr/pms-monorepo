import config from '@/config';

/**
 * The database stores only an uploaded file's bare name (e.g. "1730812345-photo.png");
 * the serving prefix lives in NEXT_PUBLIC_MEDIA_BASE_URL. These two helpers convert
 * between the stored value and a fetchable URL.
 *
 * Legacy rows that still hold a full path ("/api/blob/view/...") or an absolute URL pass
 * through unchanged, so nothing saved before the switch breaks.
 */

export const mediaUrl = (value?: string | null): string => {
  if (!value) return '';
  if (/^https?:\/\//i.test(value) || value.startsWith('/') || value.startsWith('data:')) return value;
  return `${config.mediaBaseUrl}${value}`;
};

/** The value to persist for an uploaded file: the bare name when it serves from the media base, the URL untouched otherwise. */
export const mediaName = (url: string): string => {
  if (url.startsWith(config.mediaBaseUrl)) {
    const rest = url.slice(config.mediaBaseUrl.length);
    // Only a flat file reduces to a name; anything nested keeps its path so it still resolves.
    if (rest && !rest.includes('/')) return rest;
  }
  return url;
};
