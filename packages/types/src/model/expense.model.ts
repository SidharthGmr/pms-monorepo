import { ExpenseStatus, RecurrenceInterval } from '../enum/expense-status.enum';
import { PartyType } from '../enum/party-type.enum';
import { TaxType } from '../enum/tax.enum';

export interface ExpenseModel {
  expenseDate?: Date | string | null;
  expenseAccountId: number;
  paidFromAccountId?: number | null;
  supplierId?: number | null;
  partyType?: PartyType | null;
  partyId?: string | null;
  referenceNumber?: string | null;
  notes?: string | null;
  amount: number;
  taxId?: string | null;
  taxType?: TaxType | null;
  isInterState?: boolean;
  attachments?: string[];
  /** Set on create to record and pay in one step; otherwise the expense lands as a DRAFT. */
  status?: ExpenseStatus | null;
  isTemplate?: boolean;
  recurrenceInterval?: RecurrenceInterval | null;
  recurrenceNextDate?: Date | string | null;
  recurrenceEndDate?: Date | string | null;
}

export interface ExpenseStatusModel {
  status: ExpenseStatus;
  /** Which cash or bank account the money left from. Required when moving to PAID. */
  paidFromAccountId?: number | null;
  paymentDate?: Date | string | null;
  note?: string | null;
}
