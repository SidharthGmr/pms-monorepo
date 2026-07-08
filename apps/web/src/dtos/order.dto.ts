import { OrderStatus } from '@/enums/order-status.enum';
import { OrderItemDto } from './order-item.dto';

export interface OrderDto {
  id: number;
  orderNumber: string;
  customerId: string;
  storeCode: string;
  orderDate: Date;
  totalAmount: number;
  discount: number;
  tax: number;
  shippingCost: number;
  grandTotal: number;
  status: OrderStatus;
  notes?: string | null;
  createdById?: string;
  createdByName?: string;
  createdAt: Date;
  updatedAt: Date | null;
  items?: OrderItemDto[];
  customer?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  store?: {
    name: string;
    code: string;
  };
}
