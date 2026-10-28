import { z } from "zod";

export const variantInlineFields = z.object({
  id: z.number().int().positive().optional(),
  attributes: z
    .array(
      z.object({
        attributeid: z.number({ error: "Pick an attribute" }).int().positive("Pick an attribute"),
        attributeValueId: z.number({ error: "Pick a value" }).int().positive("Pick a value"),
      })
    )
    .optional(),
  sellingPrice: z.number({ message: "Selling price is required" }).nonnegative("Selling price must be zero or greater"),
  offerPrice: z.number().nonnegative("Offer price must be zero or greater").nullable().optional(),
  costPrice: z.number().nonnegative("Cost price must be zero or greater").nullable().optional(),
  compareAtPrice: z.number().nonnegative("Compare-at price must be zero or greater").nullable().optional(),
  stockQuantity: z.number().int("Stock must be a whole number").nonnegative("Stock must be zero or greater").nullable().optional(),
  isActive: z.boolean().optional(),
  isOffer: z.boolean().optional(),
  effectiveFrom: z.coerce.date().optional(),
  effectiveTo: z.coerce.date().nullable().optional(),
});

/**
 * A row that runs an offer needs the offer amount, and its period must point forward.
 * Shared by the API schema and the form schema, which wrap variantInlineFields differently.
 */
const offerIsComplete = (row: { isOffer?: boolean; offerPrice?: number | null; effectiveFrom?: Date; effectiveTo?: Date | null }, ctx: z.RefinementCtx) => {
  if (row.isOffer && row.offerPrice == null) {
    ctx.addIssue({ code: "custom", path: ["offerPrice"], message: "Offer price is required" });
  }
  if (row.effectiveTo != null && row.effectiveTo <= (row.effectiveFrom ?? new Date())) {
    ctx.addIssue({ code: "custom", path: ["effectiveTo"], message: "The end date must be after the start date." });
  }
};

export const productFields = z.object({
  name: z.string().min(1, "Product name is required"),
  parentId: z.number().int().positive("Parent ID is required").nullable().optional(),
  categoryId: z.number().positive("Category is required"),
  brandNameId: z.number().int().positive("Select a brand or leave it empty").nullable().optional(),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().nullable().optional(),
  sellingPrice: z.number().nonnegative("Selling price must be zero or greater").optional(),
  costPrice: z.number().nonnegative("Cost price must be zero or greater").nullable().optional(),
  stock: z.number().int("Stock must be a whole number").nonnegative("Stock must be zero or greater").nullable().optional(),
  lowStockThreshold: z.number().int().nonnegative().nullable().optional(),
  images: z.array(z.string()).min(1, "Add at least one product image"),
  status: z.string().optional(),
  displayOrder: z.number().nullable().optional(),
  variants: z.array(variantInlineFields.superRefine(offerIsComplete)).max(50, "At most 50 variants in one create").optional(),
});

/**
 * What the create-product form binds to. It relaxes `productFields` in one place: a variant's
 * option row may be left entirely blank, so the Attribute/Value pickers can be shown ready to
 * use without forcing an option onto a product that has none. The form drops the blank rows
 * before sending, which is why the API keeps the stricter shape. Filling only one half of a
 * row is still an error - that is a half-made choice, not an absent one.
 */
export const productFormFields = productFields.extend({
  variants: z
    .array(
      variantInlineFields.extend({
        attributes: z
          .array(
            z
              .object({
                attributeid: z.number().int().positive("Pick an attribute").nullable().optional(),
                attributeValueId: z.number().int().positive("Pick a value").nullable().optional(),
              })
              .superRefine((row, ctx) => {
                if (row.attributeid != null && row.attributeValueId == null)
                  ctx.addIssue({ code: "custom", path: ["attributeValueId"], message: "Pick a value" });
                if (row.attributeid == null && row.attributeValueId != null)
                  ctx.addIssue({ code: "custom", path: ["attributeid"], message: "Pick an attribute" });
              })
          )
          .optional(),
      }).superRefine(offerIsComplete)
    )
    .max(50, "At most 50 variants in one create")
    .optional(),
});

export const updateProductFields = productFields.partial();

export const addStockFields = z.object({
  /**
   * Which variant receives the stock. Stock is held per variant - Small and Large keep
   * their own counts - so a movement must say which one it belongs to.
   */
  variantId: z.number().int().positive("Variant is required"),
  quantity: z.number().int().positive("Quantity must be a positive integer"),
  reason: z.string().optional(),
  // Optional price update applied alongside the stock change. When `sellingPrice` is
  // provided, a row is appended to that variant's PriceHistory ledger.
  sellingPrice: z.number().nonnegative("Selling price must be zero or greater").optional(),
  costPrice: z.number().nonnegative("Cost price must be zero or greater").nullable().optional(),
});

// Express `validate(schema)` middleware parses `{ body, query, params }`.
export const CreateProductValidator = z.object({ body: productFields });
export const updateProductSchema = z.object({ body: updateProductFields });
export const addStockSchema = z.object({ body: addStockFields });
