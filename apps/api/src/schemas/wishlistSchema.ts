import { z } from "zod";

// A save is keyed by SKU alone - the product is derived from the variant server-side, so
// accepting a productId here would only let a client contradict the catalogue.
export const createWishlistSchema = z.object({
    body: z.object({
        variantId: z.number().int().positive("product-varient Id is required"),
    }),
});
