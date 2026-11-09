import { AccountCategory } from '../enum/account-category.enum';
import { AccountSubType } from '../enum/account-sub-type.enum';
import { JournalStatus } from '../enum/journal-status.enum';
import { PartyType } from '../enum/party-type.enum';
import { VoucherType } from '../enum/voucher-type.enum';

export interface JournalLineDto {
  id: number;
  ledgerAccountId: number;
  accountCode: string;
  accountName: string;
  accountCategory: AccountCategory;
  accountSubType: AccountSubType;
  debit: number;
  credit: number;
  narration: string | null;
  partyType: PartyType | null;
  partyId: string | null;
  partyName?: string | null;
  lineOrder: number;
}

export interface JournalEntryDto {
  id: number;
  voucherNumber: string;
  voucherType: VoucherType;
  entryDate: Date | string;
  narration: string | null;
  referenceNumber: string | null;
  sourceType: string | null;
  sourceId: number | null;
  financialYearId: number | null;
  financialYearName?: string | null;
  status: JournalStatus;
  reversesEntryId: number | null;
  reversesVoucherNumber?: string | null;
  reversedByEntryId?: number | null;
  reversedByVoucherNumber?: string | null;
  reversedAt: Date | string | null;
  totalDebit: number;
  totalCredit: number;
  isOpening: boolean;
  createdById: string;
  createdByName?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  lines: JournalLineDto[];
}
