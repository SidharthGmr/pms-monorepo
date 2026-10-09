import { OrderStatus } from '@/enums/order-status.enum';

/** One tone per status, shared by the table, the cards and the detail header. */
export const ORDER_STATUS_TONE: Record<string, { label: string; dot: string; text: string; soft: string }> = {
  [OrderStatus.Pending]: { label: 'Pending', dot: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-400', soft: 'bg-amber-500/10' },
  [OrderStatus.Confirmed]: { label: 'Confirmed', dot: 'bg-sky-500', text: 'text-sky-700 dark:text-sky-400', soft: 'bg-sky-500/10' },
  [OrderStatus.Shipped]: { label: 'Shipped', dot: 'bg-indigo-500', text: 'text-indigo-700 dark:text-indigo-400', soft: 'bg-indigo-500/10' },
  [OrderStatus.Delivered]: { label: 'Delivered', dot: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-400', soft: 'bg-emerald-500/10' },
  [OrderStatus.Cancelled]: { label: 'Cancelled', dot: 'bg-rose-500', text: 'text-rose-700 dark:text-rose-400', soft: 'bg-rose-500/10' },
  [OrderStatus.Returned]: { label: 'Returned', dot: 'bg-orange-500', text: 'text-orange-700 dark:text-orange-400', soft: 'bg-orange-500/10' },
};

export const toneFor = (status?: string | null) =>
  ORDER_STATUS_TONE[String(status ?? '').toUpperCase()] ?? { label: status || 'Unknown', dot: 'bg-muted-foreground', text: 'text-muted-foreground', soft: 'bg-muted' };
