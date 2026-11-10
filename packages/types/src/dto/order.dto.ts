import { OrderStatus } from '../enum/order-status.enum';
import { PaymentMethod } from '../enum/payment-method.enum';
import { OrderItemDto } from './order-item.dto';

export interface OrderDto {
  id: number;
  orderNumber: string;
  customerId: string;
  storeCode: string;
  orderDate: Date | string;
  totalAmount: number;
  discount: number;
  tax: number;
  shippingCost: number;
  grandTotal: number;
  /** Sale prices are tax-inclusive, so this is the total less the GST sitting inside it. */
  taxableAmount?: number;
  /** A presentation split of the one GST figure, the same convention estimates use. */
  isInterState?: boolean;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  status: OrderStatus;
  notes?: string | null;
  deliveredAt?: Date | string | null;
  createdById?: string | null;
  createdByName?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string | null;
  items?: OrderItemDto[];
  /** Newest first. Storefront checkouts always write one (ONLINE); counter sales write none. */
  payments?: {
    method: PaymentMethod;
    status: string;
    amount?: number;
  }[];

  customer?: {
    name?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string | null;
    /** Flattened from the customer's profile on detail reads, for B2B tax invoices. */
    gstin?: string | null;
  };
  /** The API joins the whole store row, so the bill can print real contact details. */
  store?: {
    name: string;
    code: string;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
    gstin?: string | null;
    siteName?: string | null;
    storeLogo?: string | null;
  };
}

export interface UpdateOrderStatusDto {
  status: OrderStatus;
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
