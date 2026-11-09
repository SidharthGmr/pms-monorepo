import { AllocationTargetType } from '../enum/allocation-target-type.enum';
import { PartyType } from '../enum/party-type.enum';
import { PaymentDirection } from '../enum/payment-direction.enum';
import { PaymentMethod } from '../enum/payment-method.enum';
import { PaymentStatus } from '../enum/payment-status.enum';

export interface PaymentAllocationLineDto {
  id: number;
  targetType: AllocationTargetType;
  targetId: number;
  /** The order or purchase number, so a row reads without a second lookup. */
  targetLabel: string | null;
  amount: number;
}

export interface PaymentVoucherDto {
  id: number;
  voucherNumber: string | null;
  direction: PaymentDirection;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  paymentDate: Date | string;
  remarks: string | null;
  transactionId: string | null;
  orderId: number | null;
  orderNumber: string | null;
  partyType: PartyType | null;
  partyId: string | null;
  partyName: string | null;
  ledgerAccountId: number | null;
  ledgerAccountName: string | null;
  /** The journal voucher this payment posted, if the books were configured at the time. */
  journalEntryId: number | null;
  journalVoucherNumber: string | null;
  allocations: PaymentAllocationLineDto[];
  /** Amount not yet applied to any invoice or bill - an advance until it is. */
  unallocatedAmount: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/** What a customer still owes or what is still owed to a supplier, from the journal. */
export interface OutstandingPartyDto {
  partyType: PartyType;
  partyId: string;
  partyName: string | null;
  /** Positive means they owe the business (receivable) or the business owes them (payable). */
  balance: number;
}

export interface OutstandingSummaryDto {
  receivableTotal: number;
  payableTotal: number;
  customers: OutstandingPartyDto[];
  suppliers: OutstandingPartyDto[];
}
