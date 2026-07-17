import { z } from "zod";

/**
 * Reusable field group for the admin profile form. Optional text fields
 * accept an empty string (`.or(z.literal(''))`) so untouched inputs pass
 * validation, matching how the `PUT /users/profile` endpoint treats blanks.
 */
export const profileFields = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  userName: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number must be at most 15 digits")
    .optional()
    .or(z.literal("")),
  profileImageUrl: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("")),
  address: z.string().max(255, "Address is too long").optional(),
  city: z.string().max(100, "City is too long").optional(),
  state: z.string().max(100, "State is too long").optional(),
  country: z.string().max(100, "Country is too long").optional(),
  pincode: z
    .string()
    .max(12, "Pincode is too long")
    .optional()
    .or(z.literal("")),
  bio: z.string().max(500, "Bio must be 500 characters or fewer").optional(),
});

/** Partial variant — every field optional (patch-style updates). */
export const updateProfileFields = profileFields.partial();

/**
 * Express `validate(schema)` middleware parses `{ body, query, params }`,
 * so the API-side profile validator wraps the fields under `body`.
 */
export const UpdateProfileValidator = z.object({ body: updateProfileFields });

/** Inferred form values used by react-hook-form on the client. */
export type ProfileFormValues = z.infer<typeof profileFields>;
