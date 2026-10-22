
import { formatPrice } from '@/lib/format-price';
import { PurchasedStatus, PurchaseStatusEnum } from '@pms/types';

export const formatPurchaseAmount = (amount?: number | null): string => formatPrice(Number(amount ?? 0));

export const purchaseStatusVariant = (status?: PurchasedStatus | null): 'green' | 'orange' | 'rose' | 'zinc' => {
  switch (status) {
    case PurchaseStatusEnum.Completed:
      return 'green';
    case PurchaseStatusEnum.Pending:
      return 'orange';
    case PurchaseStatusEnum.Cancelled:
      return 'rose';
    default:
      return 'zinc';
  }
};

export const purchaseStatusLabel = (status?: PurchasedStatus | null): string => {
  if (!status) return '—';
  return status.charAt(0) + status.slice(1).toLowerCase();
};
