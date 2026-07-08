import { z } from 'zod';

export const createPurchaseItemSchema = z.object({
  productId: z.number().positive(),
  quantity: z.number().positive(),
  unitCost: z.number().nonnegative(),
  totalCost: z.number().nonnegative()
});

export const createPurchaseSchema = z.object({
  body: z.object({
    invoiceNumber: z.string().optional(),
    invoiceUrl: z.string().url().optional().or(z.literal('')),
    supplierName: z.string().optional(),
    totalAmount: z.number().nonnegative(),
    notes: z.string().optional(),
    purchaseDate: z.string().optional(),
    items: z.array(createPurchaseItemSchema).min(1, "At least one item is required")
  })
});
