import { Status } from "@prisma/client";
import { z } from "zod";

export const createReviewSchema = z.object({
    body: z.object({
        orderId: z.number().int().positive("orderId is required"),
        productId: z.number().int().positive("productId is required"),
        rating: z.number().int().min(1, "Rating must be between 1 and 5").max(5, "Rating must be between 1 and 5"),
        title: z.string().max(255).optional().nullable(),
        comment: z.string().max(5000).optional().nullable(),
        images: z.array(z.string()).optional(),
    }),
});

export const updateReviewSchema = z.object({
    body: z.object({
        rating: z.number().int().min(1, "Rating must be between 1 and 5").max(5, "Rating must be between 1 and 5").optional(),
        title: z.string().max(255).optional().nullable(),
        comment: z.string().max(5000).optional().nullable(),
        images: z.array(z.string()).optional(),
        status: z.nativeEnum(Status).optional(),
    }),
});

export const createReviewReplySchema = z.object({
    body: z.object({
        reviewId: z.number().int().positive("reviewId is required"),
        comment: z.string().min(1, "Comment is required").max(5000),
    }),
});

export const updateReviewReplySchema = z.object({
    body: z.object({
        comment: z.string().min(1, "Comment is required").max(5000),
    }),
});
