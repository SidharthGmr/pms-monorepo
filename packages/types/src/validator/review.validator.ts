import { z } from "zod";
import { StatusEnum } from "../enum/status.enum";
import { numeric } from "./fields";

/** Backs the customer write-review form. */
export const reviewFields = z.object({
  rating: numeric(z.number({ error: "Please pick a rating" }).min(1, "Please pick a rating").max(5, "Rating must be between 1 and 5")),
  title: z.string().max(255, "Title is too long").nullable().optional(),
  comment: z.string().max(5000, "Comment is too long").nullable().optional(),
  images: z.array(z.string()).optional(),
});

/** Backs the admin reply dialog. */
export const reviewReplyFields = z.object({
  comment: z.string().trim().min(1, "Reply is required").max(5000, "Reply is too long"),
});

export const reviewValidator = z.object({
  body: reviewFields.extend({
    orderId: z.number().int().positive("orderId is required"),
    productId: z.number().int().positive("productId is required"),
  }),
});

export const updateReviewValidator = z.object({
  body: reviewFields.partial().extend({ status: z.nativeEnum(StatusEnum).optional() }),
});

export const reviewReplyValidator = z.object({
  body: reviewReplyFields.extend({ reviewId: z.number().int().positive("reviewId is required") }),
});

export const updateReviewReplyValidator = z.object({ body: reviewReplyFields });
