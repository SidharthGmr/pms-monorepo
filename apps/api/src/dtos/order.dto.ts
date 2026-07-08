import { OrderStatus } from "@prisma/client";
import { OrderItemDto } from "./order-item.dto";

export interface OrderDto {
  id: number;
  orderNumber: string;
  customerId: string;
  storeCode: string
  orderDate: Date;
  totalAmount: number;
  discount: number;
  tax: number;
  shippingCost: number;
  grandTotal: number;
  status: OrderStatus;
  notes?: string | null;
  createdById?: string | null;
  createdByName?: string | null;
  createdAt: Date;
  updatedAt: Date | null;
  items?: OrderItemDto[];
}

export interface UpdateOrderDto {
  totalAmount?: number;
  discount?: number;
  tax?: number;
  shippingCost?: number;
  grandTotal?: number;
  status?: OrderStatus;
  notes?: string | null;
}
