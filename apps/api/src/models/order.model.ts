import { OrderStatus } from "@prisma/client";

export interface CreateOrderModel {
  customerId: string;
  /** Optional order date for backdated orders; defaults to now. Drives the effective-price lookup. */
  orderDate?: string | Date;
  discount?: number;
  tax?: number;
  shippingCost?: number;
  status?: OrderStatus;
  notes?: string | null;
  createdById?: string | null;
  createdByName?: string | null;
  // Only variant + quantity — the product, unit price and totals are all resolved on the
  // server. The variant is what is actually sold, so the caller has to name it.
  items?: {
    variantId: number;
    quantity: number;
  }[];
}



export interface UpdateOrderModel {
  totalAmount?: number;
  discount?: number;
  tax?: number;
  shippingCost?: number;
  grandTotal?: number;
  status?: OrderStatus;
  notes?: string;
}
