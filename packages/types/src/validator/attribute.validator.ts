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
export const attributeFields = z.object({
  name: z.string().trim().min(1, "Attribute name is required").max(100, "Attribute name must be at most 100 characters"),
  unit: z.string().trim().max(50, "Unit must be at most 50 characters").nullable().optional(),
  status: z.nativeEnum(StatusEnum).optional(),
  displayOrder: z.number().int().min(0, "Display order cannot be negative").nullable().optional(),
});

export const attributeValidator = z.object({
  body: attributeFields,
});

/**
 * PUT is a partial write - the route documents that only the properties present in the
 * body are applied, so `name` must not be required.
 */
export const updateAttributeValidator = z.object({
  body: attributeFields.partial(),
});
