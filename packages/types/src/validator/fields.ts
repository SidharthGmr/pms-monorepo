import { z } from "zod";

/**
 * Shared field builders for the form/API validators.
 *
 * These replace the hand-rolled yup helpers that used to live in `apps/web/src/schema`.
 * Keeping them here means a rule is written once and both the browser form and the API
 * route enforce exactly the same thing.
 */

const toFormNumber = (value: unknown) => {
  if (value === "" || value === null || value === undefined) return undefined;
  if (typeof value === "string") {
    const parsed = Number(value.trim());
    return Number.isNaN(parsed) ? value : parsed;
  }
  return value;
};

/**
 * Wraps a number schema so it accepts what an HTML form actually produces.
 *
 * `<input type="number">` yields a *string*, and react-hook-form passes it through
 * untouched unless the field's `onChange` converts it. Yup used to cast silently, so the
 * forms were written against that behaviour; a bare `z.number()` would reject every one of
 * them. Blank-ish input becomes `undefined`, so `.optional()` on the inner schema decides
 * whether that is allowed; a numeric string becomes a number; anything else passes through
 * unchanged so zod reports its own "must be a number" message.
 *
 * Constraints belong on the schema handed in - `numeric(z.number().min(0))` - because the
 * preprocess wrapper does not re-expose `.min()`/`.int()`.
 */
export const numeric = <T extends z.ZodTypeAny>(inner: T) => z.preprocess(toFormNumber, inner);

/** `numeric` plus the common "required number" message. */
export const numberField = (message = "Must be a number") => numeric(z.number({ error: message }));

/** Same cast, but an empty box means "no value" rather than a validation error. */
export const optionalNumberField = (message = "Must be a number") => numeric(z.number({ error: message }).optional());

/** Trimmed, required text. */
export const requiredString = (message: string, max?: number) => {
  const base = z.string().trim().min(1, message);
  return max ? base.max(max, `Must be at most ${max} characters`) : base;
};

export const emailField = (message = "Enter a valid email address") =>
  z.string().trim().min(1, "Email is required").email(message);

/**
 * The password rule the API enforces on signup and reset, kept character for character so a
 * password accepted by the form is never rejected by the server.
 */
export const passwordField = () =>
  z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

/** Letters, spaces, hyphens and apostrophes - the old yup `nameField`. */
export const personNameField = () =>
  z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must not exceed 50 characters")
    .regex(/^[a-zA-Z\s\-']+$/, "Name can only contain letters, spaces, hyphens and apostrophes");

/**
 * An Indian mobile number.
 *
 * Punctuation, a +91/0091 country code and a leading STD 0 are all stripped first, so
 * "+91 98765 43210", "098765 43210" and "9876543210" are the same number. What is left must
 * be ten digits starting 6-9, which is the range the TRAI numbering plan assigns to mobile
 * services - 1-5 are short codes and landline trunk prefixes.
 */
export const INDIAN_MOBILE = /^[6-9]\d{9}$/;

/** Strips formatting and any country/trunk prefix, leaving the 10-digit subscriber number. */
export const normalizeIndianPhone = (value: string) => {
  let digits = (value ?? "").replace(/\D/g, "");
  // Peeled in order: the 00 international prefix, then +91/091, then a trunk 0.
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 13 && digits.startsWith("091")) digits = digits.slice(3);
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return digits;
};

export const phoneField = (required = false) => {
  const message = "Enter a valid 10-digit Indian mobile number starting with 6-9";
  const digits = z
    .string()
    .transform(normalizeIndianPhone)
    .refine((value) => INDIAN_MOBILE.test(value), message);
  return required ? digits : z.union([z.literal(""), digits]).optional();
};
