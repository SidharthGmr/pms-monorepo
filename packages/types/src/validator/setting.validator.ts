import { z } from "zod";
import { INVOICE_TEMPLATE_KEYS } from "../common/invoice-template-defs";

/**
 * Flat field schema, shared by the web settings form and the API.
 *
 * Branding (logo, site name, support email) lives on each store now; the only site-wide
 * setting left is the invoice layout. Optional so a save can send just what it owns.
 */
export const settingsFields = z.object({
  invoiceTemplate: z.enum(INVOICE_TEMPLATE_KEYS).optional(),
});

export const updateSettingsValidator = z.object({
  body: settingsFields,
});
