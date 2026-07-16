import { z } from "zod";

export const productPriceFields = z.object({
  productId: z.number().int().positive("Product ID is required"),
  sellingPrice: z.number().nonnegative("Selling price must be a non-negative number"),
  costPrice: z.number().nonnegative("Cost price must be a non-negative number").nullable().optional(),
  effectiveFrom: z.coerce.date().optional(),
  reason: z.string().nullable().optional(),
});

// Express `validate(schema)` middleware parses `{ body, query, params }`.
// storeCode and createdById are taken from the authenticated user, not the body.
export const CreateProductPriceValidator = z.object({ body: productPriceFields });
