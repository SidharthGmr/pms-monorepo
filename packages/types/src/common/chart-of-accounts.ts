import { AccountCategory, AccountCategoryEnum } from '../enum/account-category.enum';
import { AccountSubType, AccountSubTypeEnum } from '../enum/account-sub-type.enum';

/**
 * The default chart of accounts a store starts from, and the single place a posting rule may
 * look an account up by name. A rule asks for `ACCOUNTS_RECEIVABLE`, never for an id or a
 * label, so a store can rename or renumber any account without breaking sales posting.
 *
 * Accounts that carry children are group headers: the posting service refuses a line against
 * any account that has children, which is what keeps totals from being counted twice.
 *
 * Inventory is seeded but deliberately stays at zero. Until an inventory valuation method is
 * chosen, purchases land in the PURCHASES expense account (a periodic system) and no rule
 * posts stock value or cost of goods sold.
 */

export const ACCOUNT_SYSTEM_KEYS = [
  'CASH_IN_HAND',
  'BANK_ACCOUNT',
  'ACCOUNTS_RECEIVABLE',
  'INVENTORY',
  'ADVANCE_TO_SUPPLIER',
  'CGST_INPUT',
  'SGST_INPUT',
  'IGST_INPUT',
  'SUSPENSE',
  'ACCOUNTS_PAYABLE',
  'ADVANCE_FROM_CUSTOMER',
  'CGST_OUTPUT',
  'SGST_OUTPUT',
  'IGST_OUTPUT',
  'SALARY_PAYABLE',
  'OWNERS_CAPITAL',
  'OPENING_BALANCE_EQUITY',
  'RETAINED_EARNINGS',
  'SALES_REVENUE',
  'SHIPPING_INCOME',
  'DISCOUNT_RECEIVED',
  'OTHER_INCOME',
  'ROUND_OFF',
  'COST_OF_GOODS_SOLD',
  'PURCHASES',
  'DISCOUNT_ALLOWED',
  'SALARY_EXPENSE',
  'RENT_EXPENSE',
  'ELECTRICITY_EXPENSE',
  'INTERNET_EXPENSE',
  'TRANSPORTATION_EXPENSE',
  'OFFICE_SUPPLIES_EXPENSE',
  'MAINTENANCE_EXPENSE',
  'BANK_CHARGES',
  'MISCELLANEOUS_EXPENSE',
] as const;

export type AccountSystemKey = (typeof ACCOUNT_SYSTEM_KEYS)[number];

export interface ChartOfAccountSeed {
  code: string;
  name: string;
  category: AccountCategory;
  subType: AccountSubType;
  parentCode?: string;
  systemKey?: AccountSystemKey;
  description?: string;
}

const { Asset, Liability, Equity, Income, Expense } = AccountCategoryEnum;
const { Cash, Bank, Receivable, Payable, TaxInput, TaxOutput, Inventory, Other } = AccountSubTypeEnum;

export const DEFAULT_CHART_OF_ACCOUNTS: ChartOfAccountSeed[] = [
  { code: '1000', name: 'Assets', category: Asset, subType: Other },
  { code: '1100', name: 'Current Assets', category: Asset, subType: Other, parentCode: '1000' },
  { code: '1110', name: 'Cash in Hand', category: Asset, subType: Cash, parentCode: '1100', systemKey: 'CASH_IN_HAND' },
  { code: '1120', name: 'Bank Account', category: Asset, subType: Bank, parentCode: '1100', systemKey: 'BANK_ACCOUNT' },
  {
    code: '1130',
    name: 'Accounts Receivable',
    category: Asset,
    subType: Receivable,
    parentCode: '1100',
    systemKey: 'ACCOUNTS_RECEIVABLE',
    description: 'Control account. Per-customer balances are derived from the party on each journal line.',
  },
  {
    code: '1140',
    name: 'Inventory',
    category: Asset,
    subType: Inventory,
    parentCode: '1100',
    systemKey: 'INVENTORY',
    description: 'Stays at zero until an inventory valuation method is chosen; purchases post to Purchases.',
  },
  { code: '1150', name: 'Advance to Supplier', category: Asset, subType: Other, parentCode: '1100', systemKey: 'ADVANCE_TO_SUPPLIER' },
  { code: '1160', name: 'CGST Input', category: Asset, subType: TaxInput, parentCode: '1100', systemKey: 'CGST_INPUT' },
  { code: '1170', name: 'SGST Input', category: Asset, subType: TaxInput, parentCode: '1100', systemKey: 'SGST_INPUT' },
  { code: '1180', name: 'IGST Input', category: Asset, subType: TaxInput, parentCode: '1100', systemKey: 'IGST_INPUT' },
  {
    code: '1900',
    name: 'Suspense',
    category: Asset,
    subType: Other,
    parentCode: '1000',
    systemKey: 'SUSPENSE',
    description: 'Holds a posting that cannot yet be classified. A non-zero balance here is a to-do, not a result.',
  },

  { code: '2000', name: 'Liabilities', category: Liability, subType: Other },
  { code: '2100', name: 'Current Liabilities', category: Liability, subType: Other, parentCode: '2000' },
  {
    code: '2110',
    name: 'Accounts Payable',
    category: Liability,
    subType: Payable,
    parentCode: '2100',
    systemKey: 'ACCOUNTS_PAYABLE',
    description: 'Control account. Per-supplier balances are derived from the party on each journal line.',
  },
  { code: '2120', name: 'Advance from Customer', category: Liability, subType: Other, parentCode: '2100', systemKey: 'ADVANCE_FROM_CUSTOMER' },
  { code: '2130', name: 'CGST Output', category: Liability, subType: TaxOutput, parentCode: '2100', systemKey: 'CGST_OUTPUT' },
  { code: '2140', name: 'SGST Output', category: Liability, subType: TaxOutput, parentCode: '2100', systemKey: 'SGST_OUTPUT' },
  { code: '2150', name: 'IGST Output', category: Liability, subType: TaxOutput, parentCode: '2100', systemKey: 'IGST_OUTPUT' },
  { code: '2160', name: 'Salary Payable', category: Liability, subType: Other, parentCode: '2100', systemKey: 'SALARY_PAYABLE' },

  { code: '3000', name: 'Equity', category: Equity, subType: Other },
  { code: '3100', name: "Owner's Capital", category: Equity, subType: Other, parentCode: '3000', systemKey: 'OWNERS_CAPITAL' },
  {
    code: '3200',
    name: 'Opening Balance Equity',
    category: Equity,
    subType: Other,
    parentCode: '3000',
    systemKey: 'OPENING_BALANCE_EQUITY',
    description: 'The balancing side of every opening balance. Should return to zero once opening balances are complete.',
  },
  { code: '3300', name: 'Retained Earnings', category: Equity, subType: Other, parentCode: '3000', systemKey: 'RETAINED_EARNINGS' },

  { code: '4000', name: 'Income', category: Income, subType: Other },
  { code: '4100', name: 'Sales Revenue', category: Income, subType: Other, parentCode: '4000', systemKey: 'SALES_REVENUE' },
  { code: '4200', name: 'Shipping Charges Collected', category: Income, subType: Other, parentCode: '4000', systemKey: 'SHIPPING_INCOME' },
  { code: '4300', name: 'Discount Received', category: Income, subType: Other, parentCode: '4000', systemKey: 'DISCOUNT_RECEIVED' },
  { code: '4400', name: 'Other Income', category: Income, subType: Other, parentCode: '4000', systemKey: 'OTHER_INCOME' },
  {
    code: '4900',
    name: 'Round Off',
    category: Income,
    subType: Other,
    parentCode: '4000',
    systemKey: 'ROUND_OFF',
    description: 'Absorbs sub-rupee differences so a voucher balances exactly. Can carry a debit balance.',
  },

  { code: '5000', name: 'Expenses', category: Expense, subType: Other },
  {
    code: '5100',
    name: 'Cost of Goods Sold',
    category: Expense,
    subType: Other,
    parentCode: '5000',
    systemKey: 'COST_OF_GOODS_SOLD',
    description: 'Not posted automatically; awaiting an inventory valuation method.',
  },
  {
    code: '5200',
    name: 'Purchases',
    category: Expense,
    subType: Other,
    parentCode: '5000',
    systemKey: 'PURCHASES',
    description: 'Goods bought for resale, under a periodic inventory system.',
  },
  { code: '5300', name: 'Discount Allowed', category: Expense, subType: Other, parentCode: '5000', systemKey: 'DISCOUNT_ALLOWED' },
  { code: '5400', name: 'Salary Expense', category: Expense, subType: Other, parentCode: '5000', systemKey: 'SALARY_EXPENSE' },
  { code: '5500', name: 'Rent Expense', category: Expense, subType: Other, parentCode: '5000', systemKey: 'RENT_EXPENSE' },
  { code: '5600', name: 'Electricity Expense', category: Expense, subType: Other, parentCode: '5000', systemKey: 'ELECTRICITY_EXPENSE' },
  { code: '5700', name: 'Internet Expense', category: Expense, subType: Other, parentCode: '5000', systemKey: 'INTERNET_EXPENSE' },
  { code: '5800', name: 'Transportation Expense', category: Expense, subType: Other, parentCode: '5000', systemKey: 'TRANSPORTATION_EXPENSE' },
  { code: '5900', name: 'Office Supplies', category: Expense, subType: Other, parentCode: '5000', systemKey: 'OFFICE_SUPPLIES_EXPENSE' },
  { code: '6000', name: 'Maintenance', category: Expense, subType: Other, parentCode: '5000', systemKey: 'MAINTENANCE_EXPENSE' },
  { code: '6100', name: 'Bank Charges', category: Expense, subType: Other, parentCode: '5000', systemKey: 'BANK_CHARGES' },
  { code: '6200', name: 'Miscellaneous Expenses', category: Expense, subType: Other, parentCode: '5000', systemKey: 'MISCELLANEOUS_EXPENSE' },
];

/** The codes that hold children, so a caller can tell a group header from a postable account. */
export const groupAccountCodes = (accounts: Pick<ChartOfAccountSeed, 'code' | 'parentCode'>[]): Set<string> =>
  new Set(accounts.map((account) => account.parentCode).filter((code): code is string => code != null));
