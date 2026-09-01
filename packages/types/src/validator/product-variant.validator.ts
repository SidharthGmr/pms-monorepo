import { z } from "zod";

export const productVariantFields = z.object({
  productId: z.number().int().positive("Product ID is required"),
  sku: z.string().min(1, "SKU cannot be empty").max(100, "SKU is too long").optional(),
  name: z.string().max(150, "Name is too long").nullable().optional(),
  images: z.array(z.string()).optional(),
  attributes: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
  stockQuantity: z.number().int("Stock must be a whole number").nonnegative("Stock must be zero or greater").optional(),
  sellingPrice: z.number().nonnegative("Selling price must be a non-negative number"),
  offerPrice: z.number().nonnegative("Offer price must be a non-negative number").nullable().optional(),
  costPrice: z.number().nonnegative("Cost price must be a non-negative number").nullable().optional(),
  effectiveFrom: z.coerce.date().optional(),
  reason: z.string().nullable().optional(),
  isOffer: z.boolean().optional(),
  supersedePrevious: z.boolean().optional(),
});

// Express `validate(schema)` middleware parses `{ body, query, params }`.
// storeCode and createdById are taken from the authenticated user, not the body.
export const CreateProductVariantValidator = z.object({ body: productVariantFields });

/**
 * Full edit of a variant. Plain columns are written directly; a changed price is appended
 * to the PriceHistory ledger and a changed stock figure is booked as an adjustment movement
 * (the service handles both), so history is never overwritten.
 */
export const updateProductVariantFields = z.object({
  name: z.string().max(150, "Name is too long").nullable().optional(),
  sku: z.string().min(1, "SKU cannot be empty").max(100, "SKU is too long").optional(),
  barcode: z.string().max(100, "Barcode is too long").nullable().optional(),
  attributes: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
  images: z.array(z.string()).optional(),
  lowStockThreshold: z.number().int("Threshold must be a whole number").nonnegative("Threshold must be zero or greater").nullable().optional(),
  isActive: z.boolean().optional(),
  isOffer: z.boolean().optional(),
  sellingPrice: z.number().nonnegative("Selling price must be a non-negative number").optional(),
  offerPrice: z.number().nonnegative("Offer price must be a non-negative number").nullable().optional(),
  costPrice: z.number().nonnegative("Cost price must be a non-negative number").nullable().optional(),
  effectiveFrom: z.coerce.date().optional(),
  stockQuantity: z.number().int("Stock must be a whole number").nonnegative("Stock must be zero or greater").nullable().optional(),
  reason: z.string().nullable().optional(),
});

export const UpdateProductVariantValidator = z.object({ body: updateProductVariantFields });

/**
 * A star rating for one variant. The rater comes from the token and the store from the
 * variant, so the body carries only the score.
 */
export const rateProductVariantFields = z.object({
  // Whole stars only - the column is an Int, so 4.5 would silently truncate.
  rating: z.number().int("rating must be a whole number").min(1, "rating must be between 1 and 5").max(5, "rating must be between 1 and 5"),
});

export const RateProductVariantValidator = z.object({ body: rateProductVariantFields });
