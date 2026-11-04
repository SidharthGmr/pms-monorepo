import { z } from "zod";
import { numeric, optionalNumberField } from "./fields";

/** A date box hands back `""` when cleared and a `Date` when picked; both mean "no value" here. */
const dateField = z.union([z.string(), z.date()]).nullable().optional();

export const priceHistoryFields = z.object({
  variantId: numeric(
    z
      .number({ error: "Variant is required" })
      .int()
      .positive("Please pick a variant"),
  ),
  sellingPrice: numeric(
    z
      .number({ error: "Selling price must be a number" })
      .min(0, "Selling price cannot be negative"),
  ),
  offerPrice: optionalNumberField("Offer price must be a number")
    .refine(
      (value) => value === undefined || value >= 0,
      "Offer price cannot be negative",
    )
    .nullable(),
  isOffer: z.boolean().optional(),
  costPrice: optionalNumberField("Purchase price must be a number")
    .refine(
      (value) => value === undefined || value >= 0,
      "Purchase price cannot be negative",
    )
    .nullable(),
  effectiveFrom: dateField,
  effectiveTo: dateField,
  reason: z.string().max(500, "Reason is too long").nullable().optional(),
});

/**
 * Cross-field rules that cannot live on a single key. Written as a refiner rather than
 * baked into `priceHistoryFields` so the object stays an open `ZodObject` that the update
 * validator can still `.omit()` and `.partial()`.
 */
const priceRulesAreCoherent = (
  values: {
    sellingPrice?: number;
    offerPrice?: number | null;
    isOffer?: boolean;
    effectiveFrom?: Date | string | null;
    effectiveTo?: Date | string | null;
  },
  ctx: z.RefinementCtx,
) => {
  if (
    values.offerPrice != null &&
    values.sellingPrice != null &&
    values.offerPrice > values.sellingPrice
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["offerPrice"],
      message: "Offer price cannot be higher than the selling price",
    });
  }

  // An offer with no price to charge would silently fall back to the selling price.
  if (values.isOffer && values.offerPrice == null) {
    ctx.addIssue({
      code: "custom",
      path: ["offerPrice"],
      message: "Enter the offer price, or turn the offer off",
    });
  }

  if (values.effectiveTo == null) return;
  const from = values.effectiveFrom
    ? new Date(values.effectiveFrom)
    : new Date();
  const to = new Date(values.effectiveTo);
  if (!isNaN(to.getTime()) && !isNaN(from.getTime()) && to <= from) {
    ctx.addIssue({
      code: "custom",
      path: ["effectiveTo"],
      message: "The end date must be after the start date",
    });
  }
};

/** What the add/edit form binds to - the same object plus the cross-field checks. */
export const priceHistoryFormFields = priceHistoryFields.superRefine(
  priceRulesAreCoherent,
);

export const priceHistoryValidator = z.object({ body: priceHistoryFormFields });

/** PUT cannot move a price row to another variant, so `variantId` is dropped entirely. */
export const updatePriceHistoryValidator = z.object({
  body: priceHistoryFields
    .omit({ variantId: true })
    .partial()
    .superRefine(priceRulesAreCoherent),
});
