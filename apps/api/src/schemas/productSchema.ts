import { z } from "zod";
import { Status } from "@prisma/client";

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required"),
    parentId: z.number().int().positive("Parent ID is required").optional(),
    categoryId: z.number().positive("Category is required"),
    brandNameId: z.number().int().positive("Brand is required").optional(),
    attributeId: z.number().int().positive("Attribute is required").optional(),
    slug: z.string().min(1, "Slug is required"),
    description: z.string().optional(),
    price: z.number().nonnegative("Price must be >= 0"),
    cost: z.number().nonnegative().optional(),
    stock: z.number().int().nonnegative().optional(),
    lowStockThreshold: z.number().int().nonnegative().optional(),
    images: z.array(z.string()).optional(),
    status: z.nativeEnum(Status).optional(),
    displayOrder: z.number().optional(),
  }),
});



export const updateProductSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    slug: z.string().min(1).optional(),
    description: z.string().optional(),
    sku: z.string().min(1).optional(),
    price: z.number().nonnegative().optional(),
    cost: z.number().nonnegative().optional(),
    stock: z.number().int().nonnegative().optional(),
    lowStockThreshold: z.number().int().nonnegative().optional(),
    categoryId: z.number().int().positive().optional(),
    images: z.array(z.string()).optional(),
    status: z.nativeEnum(Status).optional(),
  }),
});

export const addStockSchema = z.object({
  body: z.object({
    quantity: z.number().int().positive("Quantity must be a positive integer"),
    reason: z.string().optional(),
  }),
});
