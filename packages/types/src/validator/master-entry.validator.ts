import { z } from "zod";
import { StatusEnum } from "../enum/status.enum";
import { optionalNumberField, numeric } from "./fields";

/**
 * `code` is the stable key other features select by, so it is constrained to an uppercase
 * snake token rather than free text.
 */
export const masterAttributeFields = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name is too long"),
  code: z
    .string()
    .trim()
    .min(1, "Code is required")
    .max(50, "Code is too long")
    .regex(/^[A-Z][A-Z0-9_]*$/, "Use uppercase letters, numbers and underscores (e.g. SIZE, SHOE_SIZE)"),
  // Both scopes are optional - leaving them empty makes the attribute global.
  categoryId: optionalNumberField("Category must be a number").nullable(),
  brandNameId: optionalNumberField("Brand must be a number").nullable(),
  status: z.nativeEnum(StatusEnum),
  displayOrder: optionalNumberField("Display order must be a number").nullable(),
});

/**
 * Add collects a list of values and creates one entry per item; edit works on the single row
 * it opened, so both forms share this shape with the array holding exactly one entry.
 */
export const masterEntryFields = z.object({
  attributeId: numeric(z.number({ error: "Attribute is required" }).min(1, "Please pick an attribute")),
  values: z
    .array(z.string().trim().min(1, "Value is required").max(100, "Value is too long"))
    .min(1, "Add at least one value")
    .refine((list) => {
      const filled = list.map((value) => value.trim()).filter(Boolean);
      return new Set(filled).size === filled.length;
    }, "Remove the repeated values"),
  status: z.nativeEnum(StatusEnum),
  displayOrder: optionalNumberField("Display order must be a number").nullable(),
});

export const masterAttributeValidator = z.object({ body: masterAttributeFields.partial({ status: true }) });

export const updateMasterAttributeValidator = z.object({ body: masterAttributeFields.partial() });

export const masterEntryValidator = z.object({
  body: masterEntryFields.partial({ status: true }).extend({
    /** Falls back to the value itself when the caller does not send a separate label. */
    name: z.string().min(1).max(100).optional(),
    colorHex: z
      .string()
      .regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, "Use a hex colour like #FF0000")
      .optional()
      .nullable(),
    metadata: z.record(z.string(), z.unknown()).optional().nullable(),
  }),
});

/** Update edits one existing row, so it carries a single value rather than a list. */
export const updateMasterEntryValidator = z.object({
  body: z.object({
    attributeId: z.number().int().positive().optional(),
    name: z.string().min(1).max(100).optional(),
    value: z.string().min(1).max(100).optional(),
    colorHex: z
      .string()
      .regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, "Use a hex colour like #FF0000")
      .optional()
      .nullable(),
    metadata: z.record(z.string(), z.unknown()).optional().nullable(),
    status: z.nativeEnum(StatusEnum).optional(),
    displayOrder: z.number().int().optional().nullable(),
  }),
});
