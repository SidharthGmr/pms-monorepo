import { z } from "zod";

export const productFields = z.object({
  name: z.string().min(1, "Product name is required"),
  parentId: z.number().int().positive("Parent ID is required").nullable().optional(),
  categoryId: z.number().positive("Category is required"),
  brandNameId: z.number().int().positive("Select a brand or leave it empty").nullable().optional(),
  attributeId: z.number().int().positive("Select an attribute or leave it empty").nullable().optional(),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().nullable().optional(),
  sellingPrice: z.number().nonnegative("Selling price must be zero or greater").optional(),
  costPrice: z.number().nonnegative("Cost price must be zero or greater").nullable().optional(),
  stock: z.number().int("Stock must be a whole number").nonnegative("Stock must be zero or greater").nullable().optional(),
  lowStockThreshold: z.number().int().nonnegative().nullable().optional(),
  images: z.array(z.string()).optional(),
  status: z.string().optional(),
  displayOrder: z.number().nullable().optional(),
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
