import { z } from "zod";
import { numeric, numberField } from "./fields";

/**
 * The receive-stock form writes a purchase. The product only narrows the variant list -
 * stock is always received against a specific SKU, which is what `purchaseItem.variantId`
 * requires.
 */
export const receiveStockItemFields = z.object({
  productId: numberField("Product is required"),
  variantId: numberField("Variant is required"),
  quantity: numeric(z.number({ error: "Quantity is required" }).min(1, "Quantity must be at least 1")),
  costPrice: numeric(z.number({ error: "Unit cost is required" }).min(0, "Unit cost must be >= 0")),
  totalCost: numeric(z.number({ error: "Total cost must be a number" }).default(0)),
});

export const receiveStockFields = z.object({
  supplierId: z.string().trim().min(1, "Please select a supplier"),
  supplierName: z.string().nullable().optional(),
  invoiceNumber: z.string().trim().min(1, "Invoice Number is required"),
  invoiceUrl: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  totalAmount: numeric(z.number({ error: "Total must be a number" }).default(0)),
  items: z.array(receiveStockItemFields).min(1, "At least one item is required"),
});

export type ReceiveStockFormValues = z.infer<typeof receiveStockFields>;
