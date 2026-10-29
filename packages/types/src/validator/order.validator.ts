import { z } from "zod";
import { OrderStatus, OrderStatusEnum } from "../enum/order-status.enum";
import { numeric } from "./fields";

/** Backs the admin order dialog; the server recomputes prices from the price history. */
export const orderFormFields = z.object({
  customerId: z.string().trim().min(1, "Customer is required"),
  discount: numeric(z.number({ error: "Enter a number" }).min(0).default(0)),
  tax: numeric(z.number({ error: "Enter a number" }).min(0).default(0)),
  shippingCost: numeric(z.number({ error: "Enter a number" }).min(0).default(0)),
  status: z.enum(Object.values(OrderStatusEnum) as [OrderStatus, ...OrderStatus[]]),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        variantId: numeric(z.number({ error: "Variant is required" })),
        quantity: numeric(z.number({ error: "Quantity is required" }).min(1, "Quantity must be at least 1")),
      })
    )
    .min(1, "Add at least one product"),
});

export type OrderFormValues = z.infer<typeof orderFormFields>;
