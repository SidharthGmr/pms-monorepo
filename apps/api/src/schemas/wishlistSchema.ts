import { z } from "zod";

export const createWishlistSchema = z.object({
    body: z.object({
        productId: z.number().int().positive("productId is required"),
    }),
});
