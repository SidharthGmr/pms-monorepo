import { describe, expect, it } from 'vitest';
import { AccountCategoryEnum } from '../enum/account-category.enum';
import { computeProfitAndLoss, ProfitLossInputRow } from './profit-loss';

const { Income, Expense, Asset, Liability } = AccountCategoryEnum;

const row = (over: Partial<ProfitLossInputRow>): ProfitLossInputRow => ({
  accountId: 1,
  code: '4100',
  name: 'Sales Revenue',
  category: Income,
  systemKey: null,
  debit: 0,
  credit: 0,
  ...over,
});

describe('computeProfitAndLoss', () => {
  it('reads income credit-normal and expenses debit-normal', () => {
    const report = computeProfitAndLoss([
      row({ accountId: 1, code: '4100', name: 'Sales Revenue', credit: 10407.71 }),
      row({ accountId: 2, code: '5500', name: 'Rent Expense', category: Expense, debit: 18000 }),
    ]);
    expect(report.incomeTotal).toBe(10407.71);
    expect(report.expenseTotal).toBe(18000);
    expect(report.netProfit).toBe(-7592.29);
  });

  it('splits purchases out as a direct cost and shows gross profit above operating expenses', () => {
    const report = computeProfitAndLoss([
      row({ accountId: 1, credit: 50000 }),
      row({ accountId: 2, code: '5100', name: 'Purchases', category: Expense, systemKey: 'PURCHASES', debit: 30000 }),
      row({ accountId: 3, code: '5500', name: 'Rent Expense', category: Expense, debit: 8000 }),
    ]);
    expect(report.directCostTotal).toBe(30000);
    expect(report.grossProfit).toBe(20000);
    expect(report.expenseTotal).toBe(8000);
    expect(report.netProfit).toBe(12000);
  });

  it('shows a contra balance as negative rather than hiding it', () => {
    const report = computeProfitAndLoss([row({ debit: 500, credit: 200 })]);
    expect(report.income).toEqual([{ accountId: 1, code: '4100', name: 'Sales Revenue', amount: -300 }]);
    expect(report.netProfit).toBe(-300);
  });

  it('ignores balance-sheet accounts entirely', () => {
    const report = computeProfitAndLoss([
      row({ category: Asset, code: '1110', name: 'Cash in Hand', debit: 99999 }),
      row({ category: Liability, code: '2110', name: 'Accounts Payable', credit: 99999 }),
      row({ accountId: 9, credit: 100 }),
    ]);
    expect(report.income).toHaveLength(1);
    expect(report.directCosts).toHaveLength(0);
    expect(report.expenses).toHaveLength(0);
    expect(report.netProfit).toBe(100);
  });

  it('drops zero lines and sorts the rest by code', () => {
    const report = computeProfitAndLoss([
      row({ accountId: 3, code: '5700', name: 'Internet Expense', category: Expense, debit: 2000 }),
      row({ accountId: 2, code: '5400', name: 'Salary Expense', category: Expense, debit: 15000 }),
      row({ accountId: 4, code: '5800', name: 'Transport', category: Expense, debit: 0 }),
    ]);
    expect(report.expenses.map((line) => line.code)).toEqual(['5400', '5700']);
  });

  it('keeps every figure at two decimals under rupee-paisa arithmetic', () => {
    const report = computeProfitAndLoss([
      row({ accountId: 1, credit: 10.105 }),
      row({ accountId: 2, code: '5500', name: 'Rent', category: Expense, debit: 3.335 }),
    ]);
    expect(report.incomeTotal).toBe(10.11);
    expect(report.expenseTotal).toBe(3.34);
    expect(report.netProfit).toBe(6.77);
  });

  it('an empty journal produces an all-zero report, not an error', () => {
    const report = computeProfitAndLoss([]);
    expect(report).toMatchObject({ incomeTotal: 0, directCostTotal: 0, grossProfit: 0, expenseTotal: 0, netProfit: 0 });
  });
});
