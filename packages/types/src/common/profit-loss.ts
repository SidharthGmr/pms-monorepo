import { AccountCategory, AccountCategoryEnum } from '../enum/account-category.enum';

/**
 * One money pipeline for the Profit & Loss report, shared by the API (the authority - it
 * aggregates the journal and feeds the totals in) and any client that wants to re-derive a
 * figure. Income carries a credit-normal balance and expenses a debit-normal one, so each
 * line's amount is its balance in the direction its category naturally grows - a negative
 * line is a contra balance and is shown, never hidden, because income that went backwards is
 * exactly what this report exists to surface.
 *
 * Purchases are split out as direct costs so the report can show a gross profit line, but
 * note what D2 means here: this application runs periodic inventory with no stock valuation,
 * so "gross profit" is income less purchases, NOT income less cost of goods sold - unsold
 * stock still sits inside the purchases figure until a valuation method is chosen.
 */

/** The expense accounts that stand between revenue and gross profit rather than below it. */
export const DIRECT_COST_SYSTEM_KEYS = ['PURCHASES', 'COST_OF_GOODS_SOLD'] as const;

export interface ProfitLossInputRow {
  accountId: number;
  code: string;
  name: string;
  category: AccountCategory;
  systemKey?: string | null;
  debit: number;
  credit: number;
}

export interface ProfitLossLine {
  accountId: number;
  code: string;
  name: string;
  amount: number;
}

export interface ProfitLossReport {
  income: ProfitLossLine[];
  incomeTotal: number;
  directCosts: ProfitLossLine[];
  directCostTotal: number;
  grossProfit: number;
  expenses: ProfitLossLine[];
  expenseTotal: number;
  netProfit: number;
}

const round2 = (value: number) => Math.round(value * 100) / 100;

const byCode = (a: ProfitLossLine, b: ProfitLossLine) => a.code.localeCompare(b.code, undefined, { numeric: true });

const sum = (lines: ProfitLossLine[]) => round2(lines.reduce((total, line) => total + line.amount, 0));

export function computeProfitAndLoss(rows: ProfitLossInputRow[]): ProfitLossReport {
  const income: ProfitLossLine[] = [];
  const directCosts: ProfitLossLine[] = [];
  const expenses: ProfitLossLine[] = [];

  for (const row of rows) {
    const debit = round2(Number(row.debit) || 0);
    const credit = round2(Number(row.credit) || 0);
    const line = { accountId: row.accountId, code: row.code, name: row.name };

    if (row.category === AccountCategoryEnum.Income) {
      const amount = round2(credit - debit);
      if (amount !== 0) income.push({ ...line, amount });
    } else if (row.category === AccountCategoryEnum.Expense) {
      const amount = round2(debit - credit);
      if (amount === 0) continue;
      if (row.systemKey && (DIRECT_COST_SYSTEM_KEYS as readonly string[]).includes(row.systemKey)) directCosts.push({ ...line, amount });
      else expenses.push({ ...line, amount });
    }
    // Balance-sheet categories are not part of a P&L; the caller may pass them freely and
    // they simply do not appear.
  }

  income.sort(byCode);
  directCosts.sort(byCode);
  expenses.sort(byCode);

  const incomeTotal = sum(income);
  const directCostTotal = sum(directCosts);
  const grossProfit = round2(incomeTotal - directCostTotal);
  const expenseTotal = sum(expenses);
  const netProfit = round2(grossProfit - expenseTotal);

  return { income, incomeTotal, directCosts, directCostTotal, grossProfit, expenses, expenseTotal, netProfit };
}
