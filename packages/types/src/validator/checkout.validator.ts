import { z } from "zod";
import { numeric } from "./fields";

export const DiscountModeValues = ["flat", "percent"] as const;

/**
 * Backs the POS checkout panel. The API only takes a flat discount amount, so a percentage
 * is converted to money before the request - the cap here just keeps the input sane.
 */
export const checkoutFields = z
  .object({
    customerId: z.string().trim().min(1, "Select a customer"),
    discountMode: z.enum(DiscountModeValues).default("flat"),
    discountValue: numeric(z.number({ error: "Must be a number" }).min(0, "Must be 0 or more").default(0)),
    tax: numeric(z.number({ error: "Must be a number" }).min(0, "Must be 0 or more").default(0)),
    shippingCost: numeric(z.number({ error: "Must be a number" }).min(0, "Must be 0 or more").default(0)),
    platformFee: numeric(z.number({ error: "Must be a number" }).min(0, "Must be 0 or more").default(0)),
    notes: z.string().optional(),
  })
  .refine((data) => data.discountMode !== "percent" || (data.discountValue ?? 0) <= 100, {
    message: "A percentage cannot exceed 100",
    path: ["discountValue"],
  });

export type CheckoutFormValues = z.infer<typeof checkoutFields>;
