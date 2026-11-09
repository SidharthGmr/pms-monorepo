import { OrderStatus } from '../enum/order-status.enum';

export interface CreateOrderModel {
  customerId: string;
  /** Optional order date for backdated orders; defaults to now. Drives the effective-price lookup. */
  orderDate?: string | Date;
  discount?: number;
  tax?: number;
  shippingCost?: number;
  status?: OrderStatus;
  /** IGST when true, CGST+SGST otherwise. Defaults to intra-state, the walk-in POS case. */
  isInterState?: boolean;
  notes?: string | null;
  createdById?: string | null;
  createdByName?: string | null;
  // Only variant + quantity - the product, unit price and totals are all resolved on the
  // server. The variant is what is actually sold, so the caller has to name it.
  items?: {
    variantId: number;
    quantity: number;
    /**
     * Server-only. The price a quotation already promised the customer, read back from the
     * stored estimate when it is converted. The public order validator does not accept this
     * field, so a client can never dictate its own price with it.
     */
    unitPriceOverride?: number;
  }[];
}

export interface UpdateOrderModel {
  totalAmount?: number;
  discount?: number;
  tax?: number;
  shippingCost?: number;
  grandTotal?: number;
  status?: OrderStatus;
  notes?: string | null;
}

export interface UpdateOrderStatusModel {
  status: OrderStatus;
}
