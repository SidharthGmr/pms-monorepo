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
 * A renderable file location: an absolute http(s) URL (legacy Cloudinary images already in
 * the database) or a root-relative app path (the private-Blob serving route,
 * /api/blob/view/...). Plain z.string().url() rejects the relative form.
 */
export const urlOrAppPath = (message = "Must be a valid URL or app path") =>
  z.string().refine((value) => /^https?:\/\/\S+$/i.test(value) || /^\/\S*$/.test(value), message);
