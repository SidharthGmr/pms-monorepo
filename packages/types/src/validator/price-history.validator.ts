import { z } from "zod";
import { numeric, optionalNumberField } from "./fields";

export const priceHistoryFields = z.object({
  variantId: numeric(z.number({ error: "Variant is required" }).int().positive("Please pick a variant")),
  sellingPrice: numeric(z.number({ error: "Selling price must be a number" }).min(0, "Selling price cannot be negative")),
  costPrice: optionalNumberField("Cost price must be a number").refine((value) => value === undefined || value >= 0, "Cost price cannot be negative").nullable(),
  effectiveFrom: z.union([z.string(), z.date()]).nullable().optional(),
  reason: z.string().max(500, "Reason is too long").nullable().optional(),
});

export const priceHistoryValidator = z.object({ body: priceHistoryFields });

/** PUT cannot move a price row to another variant, so `variantId` is dropped entirely. */
export const updatePriceHistoryValidator = z.object({
  body: priceHistoryFields.omit({ variantId: true }).partial(),
});
