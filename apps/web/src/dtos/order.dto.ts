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
    name?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string | null;
  };
  /** The API joins the whole store row, so the bill can print real contact details. */
  store?: {
    name: string;
    code: string;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
  };
}
