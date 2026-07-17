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
  // Only product + quantity — unit price and totals are resolved on the server.
  items?: {
    productId: number;
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
