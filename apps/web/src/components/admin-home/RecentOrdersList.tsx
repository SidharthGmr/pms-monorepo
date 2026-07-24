'use client';

import { OrderDto } from '@/dtos/order.dto';
import { OrderStatus } from '@/enums/order-status.enum';
import { useGetAllOrders } from '@/hooks/service-hooks/useOrderService';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ArrowRight, Package, User, UserRound } from 'lucide-react';
import Link from 'next/link';
import { DashboardEmptyState } from '../skelton/empty-states';
import ProductsOrdersSkeleton from '../skelton/products-orders';
import { CardDescription } from '../ui/card';

const STATUS_DOT: Record<string, string> = {
  [OrderStatus.Pending]: 'bg-amber-500',
  [OrderStatus.Confirmed]: 'bg-blue-500',
  [OrderStatus.Shipped]: 'bg-violet-500',
  [OrderStatus.Delivered]: 'bg-emerald-500',
  [OrderStatus.Cancelled]: 'bg-rose-500',
  [OrderStatus.Returned]: 'bg-orange-500',
};

const STATUS_TEXT: Record<string, string> = {
  [OrderStatus.Pending]: 'text-amber-600 dark:text-amber-400',
  [OrderStatus.Confirmed]: 'text-blue-600 dark:text-blue-400',
  [OrderStatus.Shipped]: 'text-violet-600 dark:text-violet-400',
  [OrderStatus.Delivered]: 'text-emerald-600 dark:text-emerald-400',
  [OrderStatus.Cancelled]: 'text-rose-600 dark:text-rose-400',
  [OrderStatus.Returned]: 'text-orange-600 dark:text-orange-400',
};

export default function RecentOrdersList() {
  const { data: response, isLoading, isError } = useGetAllOrders({ page: 1, recordPerPage: 6 });

  if (isLoading) return <ProductsOrdersSkeleton />;
  if (isError) return <CardDescription>{response?.data?.message || 'Something went wrong.'}</CardDescription>;

  const orders: OrderDto[] = response?.data?.data?.data || [];

  if (orders.length === 0) {
    return (
      <DashboardEmptyState
        title="No orders yet"
        description="Recent orders will appear here."
        ctaUrl="/admin/orders"
        ctaTitle="Go to Orders"
        icon={Package}
      />
    );
  }

  return (
    <div className="divide-y divide-border/60">
      {orders.map((order) => {
        const customerName = order?.customer ? `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim() : '';
        const itemCount = order.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
        const productNames = (order.items || [])
          .map((item) => item.product?.name || `#${item.productId}`)
          .filter(Boolean)
          .join(', ');

        return (
          <Link
            key={order.id}
            href={`/admin/orders/${order.id}`}
            className="group flex items-start gap-3 py-3 first:pt-0 last:pb-0"
          >
            <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', STATUS_DOT[order.status] || 'bg-muted-foreground')} />

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-semibold text-foreground">{order.orderNumber}</span>
                <span className={cn('text-xs font-medium', STATUS_TEXT[order.status] || 'text-muted-foreground')}>{order.status}</span>
              </div>
              <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                <span>{formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}</span>
                <span className="h-1 w-1 shrink-0 rounded-full bg-border" />
                <span>{itemCount} items</span>
              </div>

              {/* Created by / customer / products */}
              <div className="mt-2 flex flex-col gap-1 rounded-lg bg-muted/40 p-2 text-xs">
                <div className="flex items-center gap-4">
                  <span className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
                    <UserRound className="h-3.5 w-3.5 shrink-0" />
                    Created by
                    <span className="truncate font-medium text-foreground">{order.createdByName || '—'}</span>
                  </span>
                  <span className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
                    <User className="h-3.5 w-3.5 shrink-0" />
                    Customer
                    <span className="truncate font-medium text-foreground">{customerName || 'Walk-in'}</span>
                  </span>
                </div>
                <div className="flex items-start gap-1.5 text-muted-foreground">
                  <Package className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span className="line-clamp-1 text-foreground">{productNames || '—'}</span>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1 pt-0.5">
              <span className="text-sm font-semibold text-foreground">
                ₹{order.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
