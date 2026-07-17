import { z } from "zod";

export const productFields = z.object({
  name: z.string().min(1, "Product name is required"),
  parentId: z.number().int().positive("Parent ID is required").nullable().optional(),
  categoryId: z.number().positive("Category is required"),
  brandNameId: z.number().int().positive("Brand is required").nullable().optional(),
  attributeId: z.number().int().positive("Attribute is required").nullable().optional(),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().nullable().optional(),
  lowStockThreshold: z.number().int().nonnegative().nullable().optional(),
  images: z.array(z.string()).optional(),
  status: z.string().optional(),
  displayOrder: z.number().nullable().optional(),
});

export const updateProductFields = productFields.partial();

export const addStockFields = z.object({
  quantity: z.number().int().positive("Quantity must be a positive integer"),
  reason: z.string().optional(),
  // Optional price update applied alongside the stock change. When
  // `sellingPrice` is provided a new active price row is created for the product.
  sellingPrice: z.number().nonnegative("Selling price must be zero or greater").optional(),
  costPrice: z.number().nonnegative("Cost price must be zero or greater").nullable().optional(),
});

// Express `validate(schema)` middleware parses `{ body, query, params }`.
export const CreateProductValidator = z.object({ body: productFields });
export const updateProductSchema = z.object({ body: updateProductFields });
export const addStockSchema = z.object({ body: addStockFields });
