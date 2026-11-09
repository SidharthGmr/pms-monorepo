import { AccountCategory } from '../enum/account-category.enum';
import { AccountSubType } from '../enum/account-sub-type.enum';
import { PartyType } from '../enum/party-type.enum';
import { VoucherType } from '../enum/voucher-type.enum';

/**
 * One account's statement over a period: what it was worth before the period, every movement
 * inside it in date order, and what it is worth after.
 *
 * Nothing here is stored. Opening balance is the sum of every line before the window and the
 * closing balance is opening plus the window's movement, both derived from journal lines on
 * read - the journal is the only source of truth for what an account is worth.
 */
export interface LedgerStatementRowDto {
  journalEntryId: number;
  lineId: number;
  voucherNumber: string;
  voucherType: VoucherType;
  entryDate: Date | string;
  narration: string | null;
  referenceNumber: string | null;
  /** The other accounts on the same voucher, which is what makes a statement readable. */
  contraAccounts: string[];
  partyType: PartyType | null;
  partyId: string | null;
  debit: number;
  credit: number;
  /** Running balance after this row, in the direction the account naturally grows. */
  balance: number;
}

export interface LedgerStatementDto {
  accountId: number;
  code: string;
  name: string;
  category: AccountCategory;
  subType: AccountSubType;
  /** Which side a positive balance sits on, so the UI can label it Dr or Cr. */
  nature: 'DEBIT' | 'CREDIT';
  partyType: PartyType | null;
  partyId: string | null;
  partyName: string | null;
  startDate: Date | string | null;
  endDate: Date | string | null;
  openingBalance: number;
  totalDebit: number;
  totalCredit: number;
  closingBalance: number;
  rowCount: number;
  rows: LedgerStatementRowDto[];
}

export interface TrialBalanceRowDto {
  accountId: number;
  code: string;
  name: string;
  category: AccountCategory;
  subType: AccountSubType;
  /** Where the balance lands once netted, so the two columns always foot. */
  debit: number;
  credit: number;
}

export interface TrialBalanceDto {
  startDate: Date | string | null;
  endDate: Date | string | null;
  rows: TrialBalanceRowDto[];
  totalDebit: number;
  totalCredit: number;
  /** Zero in healthy books; anything else means something posted out of balance. */
  difference: number;
  isBalanced: boolean;
}
