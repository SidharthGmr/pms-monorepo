import { ExpenseStatus, RecurrenceInterval } from '../enum/expense-status.enum';
import { PartyType } from '../enum/party-type.enum';
import { TaxType } from '../enum/tax.enum';

export interface ExpenseDto {
  id: number;
  expenseNumber: string;
  storeCode: string;
  expenseDate: Date | string;
  expenseAccountId: number;
  expenseAccountCode?: string | null;
  expenseAccountName?: string | null;
  paidFromAccountId?: number | null;
  paidFromAccountName?: string | null;
  supplierId?: number | null;
  supplierName?: string | null;
  partyType?: PartyType | null;
  partyId?: string | null;
  referenceNumber?: string | null;
  notes?: string | null;
  status: ExpenseStatus;
  amount: number;
  taxId?: string | null;
  taxName?: string | null;
  taxRate: number;
  taxType?: TaxType | null;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  taxAmount: number;
  totalAmount: number;
  isInterState: boolean;
  attachments: string[];
  isTemplate: boolean;
  templateId?: number | null;
  recurrenceInterval?: RecurrenceInterval | null;
  recurrenceNextDate?: Date | string | null;
  recurrenceEndDate?: Date | string | null;
  /** The posted voucher, when this expense has reached the journal. */
  journalEntryId?: number | null;
  journalVoucherNumber?: string | null;
  approvedById?: string | null;
  approvedByName?: string | null;
  approvedAt?: Date | string | null;
  paidAt?: Date | string | null;
  createdById: string;
  createdByName?: string | null;
  createdAt: Date | string;
  updatedAt?: Date | string | null;
}

/** One expense account's total over the report window, for the expense-by-category report. */
export interface ExpenseCategoryTotalDto {
  expenseAccountId: number;
  code: string;
  name: string;
  total: number;
  taxAmount: number;
  count: number;
}

export interface ExpenseSummaryDto {
  from: Date | string;
  to: Date | string;
  paidTotal: number;
  unpaidTotal: number;
  draftTotal: number;
  taxTotal: number;
  categories: ExpenseCategoryTotalDto[];
}
