import { OrderStatus } from '@/enums/order-status.enum';

export interface CreateOrderModel {
  customerId: string;
  totalAmount: number;
  discount: number;
  tax: number;
  shippingCost: number;
  grandTotal: number;
  status: OrderStatus;
  notes?: string;
  items?: {
    productId: number;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
}

export interface UpdateOrderModel extends Partial<CreateOrderModel> { }
