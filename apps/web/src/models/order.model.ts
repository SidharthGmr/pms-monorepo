import { OrderStatus } from '@/enums/order-status.enum';

export interface CreateOrderModel {
  customerId: string;
  discount: number;
  tax: number;
  shippingCost: number;
  status: OrderStatus;
  notes?: string;
  // Only product + quantity — the server resolves unit price and computes totals.
  items?: {
    productId: number;
    quantity: number;
  }[];
}

export interface UpdateOrderModel extends Partial<CreateOrderModel> { }
