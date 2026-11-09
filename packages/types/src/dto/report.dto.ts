import { PartyType } from '../enum/party-type.enum';
import { VoucherType } from '../enum/voucher-type.enum';
import { ProfitLossLine } from '../common/profit-loss';

export interface ProfitLossDto {
  startDate: Date | string | null;
  endDate: Date | string | null;
  income: ProfitLossLine[];
  incomeTotal: number;
  directCosts: ProfitLossLine[];
  directCostTotal: number;
  /** Income less purchases. Periodic inventory: unsold stock still sits in purchases (D2). */
  grossProfit: number;
  expenses: ProfitLossLine[];
  expenseTotal: number;
  netProfit: number;
}

export interface PartyStatementRowDto {
  journalEntryId: number;
  lineId: number;
  voucherNumber: string;
  voucherType: VoucherType;
  entryDate: Date | string;
  narration: string | null;
  referenceNumber: string | null;
  /** Which control account the movement sat on - AR, AP or an advance account. */
  accountName: string;
  debit: number;
  credit: number;
  /** Running balance after this row, read from the party's side: positive = they owe us (customer) / we owe them (supplier). */
  balance: number;
}

export interface PartyStatementDto {
  partyType: PartyType;
  partyId: string;
  partyName: string | null;
  nature: 'DEBIT' | 'CREDIT';
  startDate: Date | string | null;
  endDate: Date | string | null;
  openingBalance: number;
  totalDebit: number;
  totalCredit: number;
  closingBalance: number;
  rowCount: number;
  rows: PartyStatementRowDto[];
}
