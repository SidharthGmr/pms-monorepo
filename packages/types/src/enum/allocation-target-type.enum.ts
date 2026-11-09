export type AllocationTargetType = 'ORDER' | 'PURCHASE' | 'EXPENSE';

export enum AllocationTargetTypeEnum {
  Order = 'ORDER',
  Purchase = 'PURCHASE',
  Expense = 'EXPENSE',
}

export const ALLOCATION_TARGET_TYPE_LABELS: Record<AllocationTargetType, string> = {
  ORDER: 'Sales Order',
  PURCHASE: 'Purchase',
  EXPENSE: 'Expense',
};
