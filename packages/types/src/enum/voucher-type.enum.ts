export type VoucherType =
  | 'OPENING'
  | 'JOURNAL'
  | 'SALES'
  | 'SALES_RETURN'
  | 'PURCHASE'
  | 'PURCHASE_RETURN'
  | 'RECEIPT'
  | 'PAYMENT'
  | 'CONTRA'
  | 'EXPENSE';

export enum VoucherTypeEnum {
  Opening = 'OPENING',
  Journal = 'JOURNAL',
  Sales = 'SALES',
  SalesReturn = 'SALES_RETURN',
  Purchase = 'PURCHASE',
  PurchaseReturn = 'PURCHASE_RETURN',
  Receipt = 'RECEIPT',
  Payment = 'PAYMENT',
  Contra = 'CONTRA',
  Expense = 'EXPENSE',
}

export const VOUCHER_TYPE_LABELS: Record<VoucherType, string> = {
  OPENING: 'Opening Balance',
  JOURNAL: 'Journal',
  SALES: 'Sales',
  SALES_RETURN: 'Sales Return',
  PURCHASE: 'Purchase',
  PURCHASE_RETURN: 'Purchase Return',
  RECEIPT: 'Receipt',
  PAYMENT: 'Payment',
  CONTRA: 'Contra',
  EXPENSE: 'Expense',
};

/**
 * The prefix each voucher number is drawn against, per store. Journal numbering follows the
 * same per-store sequence-with-retry the estimate module uses, so two concurrent posts cannot
 * share a number.
 */
export const VOUCHER_TYPE_PREFIXES: Record<VoucherType, string> = {
  OPENING: 'OB',
  JOURNAL: 'JV',
  SALES: 'SV',
  SALES_RETURN: 'SR',
  PURCHASE: 'PV',
  PURCHASE_RETURN: 'PR',
  RECEIPT: 'RV',
  PAYMENT: 'PY',
  CONTRA: 'CV',
  EXPENSE: 'EV',
};

/**
 * Voucher types a user may post by hand from the Journal screen. Everything else is written by
 * a posting rule from its source document, so letting a user create one directly would produce
 * an entry no document owns.
 */
export const MANUAL_VOUCHER_TYPES: VoucherType[] = [VoucherTypeEnum.Journal, VoucherTypeEnum.Opening];
