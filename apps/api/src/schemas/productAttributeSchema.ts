import { z } from "zod";

export const createProductAttributeSchema = z.object({
  body: z.object({
    productId: z.number().int().positive("Product ID is required"),
    attributeId: z.number().int().positive("Attribute ID is required"),
    value: z.string().min(1, "Value is required"),
  }),
});

export const updateProductAttributeSchema = z.object({
  body: z.object({
    value: z.string().min(1, "Value is required"),
  }),
});
