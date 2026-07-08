import { OrderStatus } from "@prisma/client";

export interface CreateOrderModel {
  customerId: string;
  totalAmount?: number;
  discount?: number;
  tax?: number;
  shippingCost?: number;
  grandTotal?: number;
  status?: OrderStatus;
  notes?: string | null;
  createdById?: string | null;
  createdByName?: string | null;
  items?: {
    productId: number;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
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
