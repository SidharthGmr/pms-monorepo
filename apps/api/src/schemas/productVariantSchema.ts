import { z } from "zod";
import { Status } from "@prisma/client";

export const createProductVariantSchema = z.object({
  body: z.object({
    productId: z.number().int().positive("Product ID is required"),
    size: z.string().optional(),
    material: z.string().optional(),
    voltage: z.string().optional(),
    color: z.string().optional(),
    extraSku: z.string().optional(),
    extraPrice: z.number().nonnegative().optional(),
    stock: z.number().int().nonnegative().optional(),
    isDefault: z.boolean().optional(),
    status: z.nativeEnum(Status).optional(),
    displayOrder: z.number().int().optional(),
  }),
});

export const updateProductVariantSchema = z.object({
  body: z.object({
    size: z.string().optional(),
    material: z.string().optional(),
    voltage: z.string().optional(),
    color: z.string().optional(),
    extraSku: z.string().optional(),
    extraPrice: z.number().nonnegative().optional(),
    stock: z.number().int().nonnegative().optional(),
    isDefault: z.boolean().optional(),
    status: z.nativeEnum(Status).optional(),
    displayOrder: z.number().int().optional(),
  }),
});
