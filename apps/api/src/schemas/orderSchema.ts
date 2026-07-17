import { z } from "zod";

const OrderStatusEnum = z.enum(["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED"]);

export const createOrderSchema = z.object({
  body: z.object({
    customerId: z.string().min(1, "Customer ID is required"),
    discount: z.number().nonnegative().optional(),
    tax: z.number().nonnegative().optional(),
    shippingCost: z.number().nonnegative().optional(),
    status: OrderStatusEnum.optional(),
    notes: z.string().optional(),
    // Only the product and quantity are accepted — the unit price and totals
    // are resolved/computed on the server from the product's price history.
    items: z.array(z.object({
      productId: z.number().int().positive(),
      quantity: z.number().int().positive(),
    })).optional(),
  }),
});

export const updateOrderSchema = z.object({
  body: z.object({
    totalAmount: z.number().nonnegative().optional(),
    discount: z.number().nonnegative().optional(),
    tax: z.number().nonnegative().optional(),
    shippingCost: z.number().nonnegative().optional(),
    grandTotal: z.number().nonnegative().optional(),
    status: OrderStatusEnum.optional(),
    notes: z.string().optional(),
  }),
});
