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
export const categoryFields = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be at most 100 characters"),
  description: z.string().nullable().optional(),
  images: z.array(z.string()).optional(),
  parentId: z.number().int().positive().nullable().optional(),
  status: z.nativeEnum(StatusEnum).optional(),
  // Optional but NOT nullable: the column is `Int NOT NULL @default(0)`. An empty box omits
  // the field, so create falls back to the DB default and a partial update leaves it alone.
  displayOrder: z.number().int().min(0, "Display order cannot be negative").optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
});

export const categoryValidator = z.object({
  body: categoryFields,
});

/** PUT is a partial write, so `name` must not be required. */
export const updateCategoryValidator = z.object({
  body: categoryFields.partial(),
});
