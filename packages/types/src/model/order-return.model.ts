import { PaymentMethod } from '../enum/payment-method.enum';
import { ReturnItemCondition } from '../enum/return-item-condition.enum';
import { ReturnStatus } from '../enum/return-status.enum';
import { ReturnType } from '../enum/return-type.enum';

export interface OrderReturnItemModel {
  orderItemId: number;
  quantity: number;
  condition?: ReturnItemCondition;
}

// Unit prices and amounts are resolved on the server from the sold order lines, exactly as a
// sale resolves them from the price ledger - the caller only names lines and quantities.
export interface OrderReturnModel {
  orderId: number;
  type: ReturnType;
  reason: string;
  notes?: string | null;
  refundMethod?: PaymentMethod | null;
  /** ADMIN only: accept a return outside the store's return window. */
  overrideWindow?: boolean;
  items: OrderReturnItemModel[];
  /** EXCHANGE only: the replacement lines, priced server-side like any sale. */
  exchangeItems?: { variantId: number; quantity: number }[];
}

export interface OrderReturnStatusModel {
  status: ReturnStatus;
  refundMethod?: PaymentMethod | null;
  refundTransactionId?: string | null;
  notes?: string | null;
}
