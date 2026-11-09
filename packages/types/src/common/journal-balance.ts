import { ACCOUNT_NATURE, AccountCategory } from '../enum/account-category.enum';

/**
 * One money pipeline for the accounting journal, shared by the API (the authority - it
 * recomputes and overwrites whatever the client sent) and the web form (live preview). A line
 * carries either a debit or a credit, never both and never neither; a voucher balances when
 * its debits equal its credits to the paisa. Everything rounds to 2dp the same way the
 * estimate pipeline does, so a voucher raised from a sale agrees with that sale's totals.
 */

export interface JournalLineInput {
  ledgerAccountId: number;
  debit?: number | null;
  credit?: number | null;
}

export interface JournalTotals {
  totalDebit: number;
  totalCredit: number;
  difference: number;
  isBalanced: boolean;
}

export const round2 = (value: number) => Math.round((Number(value) || 0) * 100) / 100;

const sideOf = (line: JournalLineInput) => ({
  debit: round2(Math.max(Number(line.debit) || 0, 0)),
  credit: round2(Math.max(Number(line.credit) || 0, 0)),
});

export function computeJournalTotals(lines: JournalLineInput[]): JournalTotals {
  let totalDebit = 0;
  let totalCredit = 0;

  for (const line of lines) {
    const { debit, credit } = sideOf(line);
    totalDebit = round2(totalDebit + debit);
    totalCredit = round2(totalCredit + credit);
  }

  const difference = round2(totalDebit - totalCredit);
  return { totalDebit, totalCredit, difference, isBalanced: difference === 0 };
}

/**
 * Every reason a set of lines cannot be posted, as plain messages. The caller decides whether
 * that becomes a 400 or a form error; an empty array means the voucher is postable.
 */
export function validateJournalLines(lines: JournalLineInput[]): string[] {
  const errors: string[] = [];

  if (lines.length < 2) {
    errors.push('A journal entry needs at least two lines');
    return errors;
  }

  lines.forEach((line, index) => {
    const position = index + 1;
    const rawDebit = Number(line.debit) || 0;
    const rawCredit = Number(line.credit) || 0;

    if (rawDebit < 0 || rawCredit < 0) {
      errors.push(`Line ${position}: an amount cannot be negative`);
      return;
    }

    const { debit, credit } = sideOf(line);
    if (debit > 0 && credit > 0) {
      errors.push(`Line ${position}: enter either a debit or a credit, not both`);
      return;
    }
    if (debit === 0 && credit === 0) {
      errors.push(`Line ${position}: enter a debit or a credit amount`);
    }
  });

  if (errors.length > 0) return errors;

  const totals = computeJournalTotals(lines);
  if (totals.totalDebit === 0) {
    errors.push('A journal entry must move a non-zero amount');
    return errors;
  }
  if (!totals.isBalanced) {
    errors.push(`Debits (${totals.totalDebit.toFixed(2)}) must equal credits (${totals.totalCredit.toFixed(2)})`);
  }

  return errors;
}

/**
 * How much one line moves its account's balance, in the direction that account naturally
 * grows. An asset debited by 100 moves +100; a liability debited by 100 moves -100. Ledger
 * running balances and the trial balance both read this rather than hard-coding a sign.
 */
export function signedMovement(category: AccountCategory, debit: number, credit: number): number {
  const net = round2((Number(debit) || 0) - (Number(credit) || 0));
  return ACCOUNT_NATURE[category] === 'DEBIT' ? net : round2(-net);
}

export interface RunningBalanceRow<T> {
  line: T;
  debit: number;
  credit: number;
  balance: number;
}

/**
 * Opening balance plus each movement in turn. The caller supplies the rows already sorted the
 * way the statement reads, because a running balance is only meaningful in one order.
 */
export function computeRunningBalance<T extends JournalLineInput>(
  openingBalance: number,
  category: AccountCategory,
  lines: T[]
): { rows: RunningBalanceRow<T>[]; closingBalance: number; totalDebit: number; totalCredit: number } {
  let balance = round2(openingBalance);
  let totalDebit = 0;
  let totalCredit = 0;
  const rows: RunningBalanceRow<T>[] = [];

  for (const line of lines) {
    const { debit, credit } = sideOf(line);
    balance = round2(balance + signedMovement(category, debit, credit));
    totalDebit = round2(totalDebit + debit);
    totalCredit = round2(totalCredit + credit);
    rows.push({ line, debit, credit, balance });
  }

  return { rows, closingBalance: balance, totalDebit, totalCredit };
}

/**
 * The lines that reverse a voucher: the same accounts with debit and credit swapped. A posted
 * entry is never edited or deleted, so this is the only way a mistake is undone.
 */
export function reverseLines<T extends JournalLineInput>(lines: T[]): (T & { debit: number; credit: number })[] {
  return lines.map((line) => {
    const { debit, credit } = sideOf(line);
    return { ...line, debit: credit, credit: debit };
  });
}
