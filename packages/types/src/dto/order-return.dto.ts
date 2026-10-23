import { PaymentMethod } from '../enum/payment-method.enum';
import { ReturnItemCondition } from '../enum/return-item-condition.enum';
import { ReturnStatus } from '../enum/return-status.enum';
import { ReturnType } from '../enum/return-type.enum';

export interface OrderReturnItemDto {
  id: number;
  orderItemId: number;
  productId: number;
  variantId: number;
  quantity: number;
  unitPrice: number;
  amount: number;
  condition: ReturnItemCondition;
  variant?: { name: string; sku: string };
  product?: { name: string };
}

export interface OrderReturnDto {
  id: number;
  returnNumber: string;
  orderId: number;
  storeCode: string;
  customerId: string;
  type: ReturnType;
  status: ReturnStatus;
  reason: string;
  notes?: string | null;
  refundAmount: number;
  refundMethod?: PaymentMethod | null;
  refundTransactionId?: string | null;
  exchangeOrderId?: number | null;
  requestedById: string;
  processedById?: string | null;
  resolvedAt?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  items?: OrderReturnItemDto[];
  order?: { orderNumber: string; grandTotal: number; status: string };
  exchangeOrder?: { orderNumber: string; grandTotal: number } | null;
  customer?: { name?: string; email?: string; phone?: string | null };
}

/** Per order line: how many units a live (not rejected/cancelled) return already claims. */
export interface ReturnedQuantityDto {
  orderItemId: number;
  quantity: number;
}
