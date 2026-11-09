import { AllocationTargetType } from '../enum/allocation-target-type.enum';
import { PartyType } from '../enum/party-type.enum';
import { PaymentDirection } from '../enum/payment-direction.enum';
import { PaymentMethod } from '../enum/payment-method.enum';
import { PaymentStatus } from '../enum/payment-status.enum';

/**
 * `orderId` is null for money that does not belong to a sales order - a supplier payment, an
 * expense settlement, a contra transfer or an advance not yet applied. A payment against an
 * order still carries it, so every existing order-payment path is unchanged.
 */
export interface PaymentDto {
  id: number;
  orderId: number | null;
  storeCode: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  direction: PaymentDirection;
  voucherNumber: string | null;
  partyType: PartyType | null;
  partyId: string | null;
  ledgerAccountId: number | null;
  transactionId?: string | null;
  paymentDate: Date | string;
  remarks?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CreatePaymentDto {
  orderId?: number | null;
  storeCode: string;
  amount: number;
  method: PaymentMethod;
  status?: PaymentStatus;
  direction?: PaymentDirection;
  voucherNumber?: string | null;
  partyType?: PartyType | null;
  partyId?: string | null;
  ledgerAccountId?: number | null;
  transactionId?: string | null;
  paymentDate?: Date;
  remarks?: string | null;
}

export interface UpdatePaymentDto {
  amount?: number;
  method?: PaymentMethod;
  status?: PaymentStatus;
  transactionId?: string | null;
  remarks?: string | null;
}

export interface PaymentAllocationDto {
  id: number;
  paymentId: number;
  targetType: AllocationTargetType;
  targetId: number;
  amount: number;
  createdAt: Date | string;
  createdById: string;
}
