import { AllocationTargetType } from '../enum/allocation-target-type.enum';
import { PartyType } from '../enum/party-type.enum';
import { PaymentDirection } from '../enum/payment-direction.enum';
import { PaymentMethod } from '../enum/payment-method.enum';

export interface PaymentAllocationModel {
  targetType: AllocationTargetType;
  targetId: number;
  amount: number;
}

/**
 * Money moving in or out that is not a payment against a single sales order.
 *
 * `moneyAccountId` is the cash or bank account it actually moved through. What it was *for* is
 * either a party (a customer receipt settles Accounts Receivable, a supplier payment settles
 * Accounts Payable - the API resolves that account, the client does not pick it) or, with no
 * party, an explicit `counterAccountId` for things like capital introduced or a cash expense.
 *
 * Anything not named in `allocations` is left unapplied, which is what makes a payment an
 * advance rather than a settlement.
 */
export interface PaymentVoucherModel {
  direction: PaymentDirection;
  moneyAccountId: number;
  counterAccountId?: number | null;
  partyType?: PartyType | null;
  partyId?: string | null;
  amount: number;
  method: PaymentMethod;
  paymentDate?: string | null;
  referenceNumber?: string | null;
  remarks?: string | null;
  allocations?: PaymentAllocationModel[];
}

/** Moving the business's own money between its own cash and bank accounts. */
export interface PaymentTransferModel {
  fromAccountId: number;
  toAccountId: number;
  amount: number;
  paymentDate?: string | null;
  remarks?: string | null;
}

export interface ReversePaymentModel {
  reason?: string | null;
}
