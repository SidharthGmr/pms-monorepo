import { z } from "zod";
import { StatusEnum } from "../enum/status.enum";

/**
 * Flat field schema, shared by the web form and the API.
 *
 * Forms get this one: react-hook-form hands the resolver flat values, so a `body`
 * wrapped schema can never match and the form silently refuses to submit.
 * The API gets the wrapped exports below, because `validate()` parses
 * `{ body, query, params }`. Same rules either way - one source of truth.
 */
export const brandNameFields = z.object({
  name: z.string().trim().min(1, "Brand name is required").max(100, "Brand name must be at most 100 characters"),
  images: z.array(z.string()).optional(),
  status: z.nativeEnum(StatusEnum).optional(),
  // Nullable as well as optional: the form sends `null` for a cleared display order.
  displayOrder: z.number().int().min(0, "Display order cannot be negative").nullable().optional(),
});

export const BrandNameValidator = z.object({
  body: brandNameFields,
});

/** PUT is a partial write, so `name` must not be required. */
export const updateBrandNameValidator = z.object({
  body: brandNameFields.partial(),
});
