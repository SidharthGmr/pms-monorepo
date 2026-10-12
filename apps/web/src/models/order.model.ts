import { OrderStatus } from '@/enums/order-status.enum';

export interface CreateOrderModel {
  customerId: string;
  discount: number;
  tax: number;
  shippingCost: number;
  status: OrderStatus;
  notes?: string;
  // Only variant + quantity — the server derives the product and resolves the price.
  items?: {
    variantId: number;
    quantity: number;
  }[];
}

export interface UpdateOrderModel extends Partial<CreateOrderModel> { }

export interface UpdateOrderStatusModel {
  status: OrderStatus;
}
