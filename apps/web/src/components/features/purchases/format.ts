import { PurchaseStatus } from '@/enums/purchase-status.enum';
import { formatPrice } from '@/lib/format-price';

export const formatPurchaseAmount = (amount?: number | null): string => formatPrice(Number(amount ?? 0));

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

export const purchaseStatusLabel = (status?: PurchaseStatus | null): string => {
  if (!status) return '—';
  return status.charAt(0) + status.slice(1).toLowerCase();
};
