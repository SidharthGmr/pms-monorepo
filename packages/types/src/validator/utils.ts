import { z } from 'zod';

/**
 * Reads a string field's max-length straight from a Zod schema, so UI hints (character
 * counters, maxLength attributes) always match the validation rule instead of repeating
 * the number. Wrappers (optional/nullable/default) are unwrapped first.
 */
export function fieldMaxLength<T extends z.ZodRawShape>(schema: z.ZodObject<T>, field: keyof T & string): number | undefined {
  let current: unknown = schema.shape[field];
  while (current && typeof (current as { unwrap?: () => unknown }).unwrap === 'function') {
    current = (current as { unwrap: () => unknown }).unwrap();
  }
  return current instanceof z.ZodString && current.maxLength !== null ? current.maxLength : undefined;
}

/**
 * A renderable file location, in any of the three shapes the database has held over time:
 * an absolute http(s) URL (legacy Cloudinary images), a root-relative app path (the
 * private-Blob serving route, /api/blob/view/...), or a bare uploaded file name
 * ("1730812345-photo.png" - the current convention; the URL prefix lives in
 * NEXT_PUBLIC_MEDIA_BASE_URL). Plain z.string().url() rejects the last two forms.
 */
const BARE_FILE_NAME = /^[a-z0-9][a-z0-9._-]*\.[a-z0-9]{2,8}$/i;

export const urlOrAppPath = (message = "Must be a valid URL or app path") =>
  z.string().refine((value) => /^https?:\/\/\S+$/i.test(value) || /^\/\S*$/.test(value) || BARE_FILE_NAME.test(value), message);
