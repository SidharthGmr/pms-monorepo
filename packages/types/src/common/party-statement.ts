import { AccountCategory, AccountCategoryEnum } from '../enum/account-category.enum';
import { PartyType, PartyTypeEnum } from '../enum/party-type.enum';
import { computeRunningBalance, JournalLineInput, RunningBalanceRow } from './journal-balance';

/**
 * The running-balance rule for a party ledger. A customer's lines live on debit-normal
 * control accounts (Accounts Receivable) but also on credit-normal ones (Advance from
 * Customer), so the statement cannot borrow its direction from any single account - it is
 * read from the party's side instead: for a customer, positive means they owe us and an
 * advance shows as a negative balance; for a supplier the mirror image. That one convention
 * is what lets receivables and advances sit on the same statement and net correctly.
 */

export function partyNatureCategory(partyType: PartyType): AccountCategory {
  // The category is only a carrier for the debit/credit direction computeRunningBalance
  // expects: ASSET reads debit-normal (customer), LIABILITY credit-normal (supplier).
  return partyType === PartyTypeEnum.Supplier ? AccountCategoryEnum.Liability : AccountCategoryEnum.Asset;
}

export function partyNature(partyType: PartyType): 'DEBIT' | 'CREDIT' {
  return partyType === PartyTypeEnum.Supplier ? 'CREDIT' : 'DEBIT';
}

export interface PartyStatementComputed<T extends JournalLineInput> {
  nature: 'DEBIT' | 'CREDIT';
  openingBalance: number;
  rows: RunningBalanceRow<T>[];
  totalDebit: number;
  totalCredit: number;
  closingBalance: number;
}

const round2 = (value: number) => Math.round(value * 100) / 100;

export function buildPartyStatement<T extends JournalLineInput>(args: {
  partyType: PartyType;
  openingDebit: number;
  openingCredit: number;
  /** Already sorted the way the statement reads - a running balance only means something in one order. */
  movements: T[];
}): PartyStatementComputed<T> {
  const nature = partyNature(args.partyType);
  const category = partyNatureCategory(args.partyType);

  const net = round2((Number(args.openingDebit) || 0) - (Number(args.openingCredit) || 0));
  const openingBalance = nature === 'DEBIT' ? net : round2(-net);

  const running = computeRunningBalance(openingBalance, category, args.movements);

  return {
    nature,
    openingBalance,
    rows: running.rows,
    totalDebit: running.totalDebit,
    totalCredit: running.totalCredit,
    closingBalance: running.closingBalance,
  };
}
