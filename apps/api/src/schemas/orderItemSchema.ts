import { z } from "zod";

export const createOrderItemSchema = z.object({
  body: z.object({
    orderId: z.number().int().positive("Order ID is required"),
    productId: z.number().int().positive("Product ID is required"),
    orderNumber: z.string().nonempty("Order number is required"),
    quantity: z.number().int().positive("Quantity must be > 0"),
    unitPrice: z.number().nonnegative("Unit price must be >= 0"),
    totalPrice: z.number().nonnegative("Total price must be >= 0"),
  }),
});

export const updateOrderItemSchema = z.object({
  body: z.object({
    quantity: z.number().int().positive().optional(),
    unitPrice: z.number().nonnegative().optional(),
    totalPrice: z.number().nonnegative().optional(),
  }),
});
