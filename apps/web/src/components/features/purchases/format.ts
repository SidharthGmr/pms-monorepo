import { PurchaseStatus } from '@/enums/purchase-status.enum';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

export const formatPurchaseAmount = (amount?: number | null): string => currencyFormatter.format(Number(amount ?? 0));

export const purchaseStatusVariant = (status?: PurchaseStatus | null): 'green' | 'orange' | 'rose' | 'zinc' => {
  switch (status) {
    case PurchaseStatus.Completed:
      return 'green';
    case PurchaseStatus.Pending:
      return 'orange';
    case PurchaseStatus.Cancelled:
      return 'rose';
    default:
      return 'zinc';
  }
};
