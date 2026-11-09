export type AccountCategory = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'INCOME' | 'EXPENSE';

export enum AccountCategoryEnum {
  Asset = 'ASSET',
  Liability = 'LIABILITY',
  Equity = 'EQUITY',
  Income = 'INCOME',
  Expense = 'EXPENSE',
}

/**
 * Which side of an account its balance normally sits on. A debit-natured account (assets,
 * expenses) rises with a debit; a credit-natured one (liabilities, equity, income) rises with
 * a credit. Running balances and the trial balance read this rather than hard-coding a sign
 * per account, so a new account behaves correctly the moment its category is chosen.
 */
export const ACCOUNT_NATURE: Record<AccountCategory, 'DEBIT' | 'CREDIT'> = {
  ASSET: 'DEBIT',
  EXPENSE: 'DEBIT',
  LIABILITY: 'CREDIT',
  EQUITY: 'CREDIT',
  INCOME: 'CREDIT',
};

export const ACCOUNT_CATEGORY_LABELS: Record<AccountCategory, string> = {
  ASSET: 'Assets',
  LIABILITY: 'Liabilities',
  EQUITY: 'Equity',
  INCOME: 'Income',
  EXPENSE: 'Expenses',
};
