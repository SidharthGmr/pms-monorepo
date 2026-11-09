export type AccountSubType = 'CASH' | 'BANK' | 'RECEIVABLE' | 'PAYABLE' | 'TAX_INPUT' | 'TAX_OUTPUT' | 'INVENTORY' | 'OTHER';

export enum AccountSubTypeEnum {
  Cash = 'CASH',
  Bank = 'BANK',
  Receivable = 'RECEIVABLE',
  Payable = 'PAYABLE',
  TaxInput = 'TAX_INPUT',
  TaxOutput = 'TAX_OUTPUT',
  Inventory = 'INVENTORY',
  Other = 'OTHER',
}

/** The accounts that hold real money, which is what separates a Cash Book from the Day Book. */
export const MONEY_SUB_TYPES: AccountSubType[] = [AccountSubTypeEnum.Cash, AccountSubTypeEnum.Bank];

/** Control accounts that carry a party subledger rather than standing alone. */
export const PARTY_CONTROL_SUB_TYPES: AccountSubType[] = [AccountSubTypeEnum.Receivable, AccountSubTypeEnum.Payable];

export const ACCOUNT_SUB_TYPE_LABELS: Record<AccountSubType, string> = {
  CASH: 'Cash',
  BANK: 'Bank',
  RECEIVABLE: 'Accounts Receivable',
  PAYABLE: 'Accounts Payable',
  TAX_INPUT: 'Tax Input',
  TAX_OUTPUT: 'Tax Output',
  INVENTORY: 'Inventory',
  OTHER: 'Other',
};
