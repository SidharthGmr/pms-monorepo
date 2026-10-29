import { z } from "zod";
import { INVOICE_TEMPLATE_KEYS } from "../common/invoice-template-defs";

/**
 * Flat field schema, shared by the web settings form and the API.
 *
 * Every field is optional so a tab can save just what it owns - the service writes only the
 * keys that are present. Empty strings are allowed and mean "clear this setting", which is how
 * removing the logo gets back to the bundled default.
 */
export const settingsFields = z.object({
  logoUrl: z.string().trim().max(2048, "Logo URL must be 2048 characters or fewer").optional(),
  siteName: z.string().trim().max(100, "Site name must be 100 characters or fewer").optional(),
  supportEmail: z
    .string()
    .trim()
    .max(254, "Support email must be 254 characters or fewer")
    .refine((value) => value === "" || z.string().email().safeParse(value).success, "Enter a valid email address")
    .optional(),
  invoiceTemplate: z.enum(INVOICE_TEMPLATE_KEYS).optional(),
});

export const updateSettingsValidator = z.object({
  body: settingsFields,
});
