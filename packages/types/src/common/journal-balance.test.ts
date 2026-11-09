import { describe, expect, it } from 'vitest';
import { computeJournalTotals, computeRunningBalance, reverseLines, signedMovement, validateJournalLines } from './journal-balance';
import { DEFAULT_CHART_OF_ACCOUNTS, groupAccountCodes } from './chart-of-accounts';

// Every expected number is hand-computed. The API posts through these functions, so an
// unbalanced voucher reaching the database would start here.
describe('computeJournalTotals', () => {
  it('sums a balanced two-line voucher', () => {
    const totals = computeJournalTotals([
      { ledgerAccountId: 1, debit: 1180 },
      { ledgerAccountId: 2, credit: 1000 },
    ]);
    expect(totals.totalDebit).toBe(1180);
    expect(totals.totalCredit).toBe(1000);
    expect(totals.difference).toBe(180);
    expect(totals.isBalanced).toBe(false);
  });

  it('balances a sale split across revenue and two GST accounts', () => {
    const totals = computeJournalTotals([
      { ledgerAccountId: 1, debit: 1180 },
      { ledgerAccountId: 2, credit: 1000 },
      { ledgerAccountId: 3, credit: 90 },
      { ledgerAccountId: 4, credit: 90 },
    ]);
    expect(totals.totalDebit).toBe(1180);
    expect(totals.totalCredit).toBe(1180);
    expect(totals.difference).toBe(0);
    expect(totals.isBalanced).toBe(true);
  });

  it('rounds each side to paisa before comparing, so thirds of a rupee still balance', () => {
    const totals = computeJournalTotals([
      { ledgerAccountId: 1, debit: 33.33 },
      { ledgerAccountId: 2, debit: 33.33 },
      { ledgerAccountId: 3, debit: 33.34 },
      { ledgerAccountId: 4, credit: 100 },
    ]);
    expect(totals.totalDebit).toBe(100);
    expect(totals.isBalanced).toBe(true);
  });

  it('treats null and missing amounts as zero rather than NaN', () => {
    const totals = computeJournalTotals([
      { ledgerAccountId: 1, debit: 500, credit: null },
      { ledgerAccountId: 2, credit: 500 },
    ]);
    expect(totals.totalDebit).toBe(500);
    expect(totals.totalCredit).toBe(500);
    expect(totals.isBalanced).toBe(true);
  });
});

describe('validateJournalLines', () => {
  it('accepts a balanced voucher', () => {
    expect(
      validateJournalLines([
        { ledgerAccountId: 1, debit: 250 },
        { ledgerAccountId: 2, credit: 250 },
      ])
    ).toEqual([]);
  });

  it('rejects a single-line voucher', () => {
    expect(validateJournalLines([{ ledgerAccountId: 1, debit: 100 }])).toEqual(['A journal entry needs at least two lines']);
  });

  it('rejects a line carrying both a debit and a credit', () => {
    const errors = validateJournalLines([
      { ledgerAccountId: 1, debit: 100, credit: 40 },
      { ledgerAccountId: 2, credit: 60 },
    ]);
    expect(errors).toContain('Line 1: enter either a debit or a credit, not both');
  });

  it('rejects an empty line', () => {
    const errors = validateJournalLines([
      { ledgerAccountId: 1, debit: 100 },
      { ledgerAccountId: 2, credit: 100 },
      { ledgerAccountId: 3 },
    ]);
    expect(errors).toContain('Line 3: enter a debit or a credit amount');
  });

  it('rejects a negative amount', () => {
    const errors = validateJournalLines([
      { ledgerAccountId: 1, debit: -100 },
      { ledgerAccountId: 2, credit: 100 },
    ]);
    expect(errors).toContain('Line 1: an amount cannot be negative');
  });

  it('rejects a voucher that moves nothing', () => {
    const errors = validateJournalLines([
      { ledgerAccountId: 1, debit: 0, credit: 0 },
      { ledgerAccountId: 2, debit: 0, credit: 0 },
    ]);
    expect(errors).toContain('Line 1: enter a debit or a credit amount');
  });

  it('reports the two sides when they disagree', () => {
    const errors = validateJournalLines([
      { ledgerAccountId: 1, debit: 100 },
      { ledgerAccountId: 2, credit: 99.5 },
    ]);
    expect(errors).toEqual(['Debits (100.00) must equal credits (99.50)']);
  });
});

describe('signedMovement', () => {
  it('grows a debit-natured account with a debit', () => {
    expect(signedMovement('ASSET', 100, 0)).toBe(100);
    expect(signedMovement('EXPENSE', 100, 0)).toBe(100);
  });

  it('shrinks a debit-natured account with a credit', () => {
    expect(signedMovement('ASSET', 0, 40)).toBe(-40);
  });

  it('grows a credit-natured account with a credit', () => {
    expect(signedMovement('LIABILITY', 0, 100)).toBe(100);
    expect(signedMovement('INCOME', 0, 100)).toBe(100);
    expect(signedMovement('EQUITY', 0, 100)).toBe(100);
  });

  it('shrinks a credit-natured account with a debit', () => {
    expect(signedMovement('INCOME', 25, 0)).toBe(-25);
  });
});

describe('computeRunningBalance', () => {
  it('carries an opening balance through each movement of a cash account', () => {
    const result = computeRunningBalance(1000, 'ASSET', [
      { ledgerAccountId: 1, debit: 500 },
      { ledgerAccountId: 1, credit: 200 },
      { ledgerAccountId: 1, debit: 50.25 },
    ]);
    expect(result.rows.map((row) => row.balance)).toEqual([1500, 1300, 1350.25]);
    expect(result.closingBalance).toBe(1350.25);
    expect(result.totalDebit).toBe(550.25);
    expect(result.totalCredit).toBe(200);
  });

  it('reads a supplier payable the other way round', () => {
    const result = computeRunningBalance(0, 'LIABILITY', [
      { ledgerAccountId: 2, credit: 5000 },
      { ledgerAccountId: 2, debit: 2000 },
    ]);
    expect(result.rows.map((row) => row.balance)).toEqual([5000, 3000]);
    expect(result.closingBalance).toBe(3000);
  });

  it('lets a cash account go negative rather than clamping, so an error stays visible', () => {
    const result = computeRunningBalance(100, 'ASSET', [{ ledgerAccountId: 1, credit: 250 }]);
    expect(result.closingBalance).toBe(-150);
  });
});

describe('reverseLines', () => {
  it('swaps each side so the pair nets to zero', () => {
    const original = [
      { ledgerAccountId: 1, debit: 1180 },
      { ledgerAccountId: 2, credit: 1000 },
      { ledgerAccountId: 3, credit: 180 },
    ];
    const reversed = reverseLines(original);
    expect(reversed).toEqual([
      { ledgerAccountId: 1, debit: 0, credit: 1180 },
      { ledgerAccountId: 2, debit: 1000, credit: 0 },
      { ledgerAccountId: 3, debit: 180, credit: 0 },
    ]);

    const combined = computeJournalTotals([...original, ...reversed]);
    expect(combined.totalDebit).toBe(combined.totalCredit);
  });

  it('produces lines that validate on their own', () => {
    const reversed = reverseLines([
      { ledgerAccountId: 1, debit: 300 },
      { ledgerAccountId: 2, credit: 300 },
    ]);
    expect(validateJournalLines(reversed)).toEqual([]);
  });
});

describe('DEFAULT_CHART_OF_ACCOUNTS', () => {
  it('has unique codes', () => {
    const codes = DEFAULT_CHART_OF_ACCOUNTS.map((account) => account.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('has unique system keys', () => {
    const keys = DEFAULT_CHART_OF_ACCOUNTS.map((account) => account.systemKey).filter(Boolean);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('points every parentCode at an account that exists', () => {
    const codes = new Set(DEFAULT_CHART_OF_ACCOUNTS.map((account) => account.code));
    const orphans = DEFAULT_CHART_OF_ACCOUNTS.filter((account) => account.parentCode != null && !codes.has(account.parentCode));
    expect(orphans).toEqual([]);
  });

  it('lists every parent before its children, so a seeder can insert in order', () => {
    const seen = new Set<string>();
    for (const account of DEFAULT_CHART_OF_ACCOUNTS) {
      if (account.parentCode != null) expect(seen.has(account.parentCode)).toBe(true);
      seen.add(account.code);
    }
  });

  it('gives a child the same category as its parent', () => {
    const byCode = new Map(DEFAULT_CHART_OF_ACCOUNTS.map((account) => [account.code, account]));
    for (const account of DEFAULT_CHART_OF_ACCOUNTS) {
      if (account.parentCode == null) continue;
      expect(byCode.get(account.parentCode)?.category).toBe(account.category);
    }
  });

  it('never gives a group header a system key, since postings must land on a leaf', () => {
    const groups = groupAccountCodes(DEFAULT_CHART_OF_ACCOUNTS);
    const keyedGroups = DEFAULT_CHART_OF_ACCOUNTS.filter((account) => groups.has(account.code) && account.systemKey != null);
    expect(keyedGroups).toEqual([]);
  });
});
