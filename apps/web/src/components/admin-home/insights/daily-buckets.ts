import { OrderDto, OrderStatusEnum } from '@pms/types';
import { isSameDay, startOfDay, subDays } from 'date-fns';

/**
 * The orders API has no date filter, so a page of the newest orders is bucketed by day on the
 * client. FETCH_LIMIT is comfortably above a fortnight of orders for the stores this serves;
 * `truncated` says when a store has outgrown it so a panel can admit the series is partial
 * rather than quietly under-counting.
 */
export const FETCH_LIMIT = 200;

const EXCLUDED: string[] = [OrderStatusEnum.Cancelled, OrderStatusEnum.Returned];

export interface DayBucket {
  date: Date;
  sales: number;
  orders: number;
}

export const bucketOrdersByDay = (orders: OrderDto[], days: number): DayBucket[] => {
  const today = startOfDay(new Date());
  const buckets: DayBucket[] = Array.from({ length: days }, (_, index) => ({
    date: subDays(today, days - 1 - index),
    sales: 0,
    orders: 0,
  }));

  for (const order of orders) {
    if (EXCLUDED.includes(String(order.status))) continue;
    const placed = order.orderDate ?? order.createdAt;
    if (!placed) continue;
    const when = new Date(placed);
    const bucket = buckets.find((entry) => isSameDay(entry.date, when));
    if (!bucket) continue;
    bucket.sales += Number(order.grandTotal ?? 0);
    bucket.orders += 1;
  }

  return buckets;
};
