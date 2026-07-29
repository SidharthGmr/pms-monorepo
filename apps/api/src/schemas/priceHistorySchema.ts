import { z } from 'zod';

export const createPriceHistorySchema = z.object({
  body: z.object({
    variantId: z.number().int().positive('variantId is required'),
    sellingPrice: z.number().nonnegative('sellingPrice must be zero or greater'),
    costPrice: z.number().nonnegative('costPrice must be zero or greater').optional().nullable(),
    effectiveFrom: z.coerce.date().optional(),
    reason: z.string().max(500).optional().nullable(),
  }),
});

export const updatePriceHistorySchema = z.object({
  body: z.object({
    sellingPrice: z.number().nonnegative('sellingPrice must be zero or greater').optional(),
    costPrice: z.number().nonnegative('costPrice must be zero or greater').optional().nullable(),
    effectiveFrom: z.coerce.date().optional(),
    reason: z.string().max(500).optional().nullable(),
  }),
});
