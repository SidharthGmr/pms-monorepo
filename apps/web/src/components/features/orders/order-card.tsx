'use client';

import CardAction from '@/components/common/card-action';
import { Card } from '@/components/ui/card';
import { OrderDto } from '@/dtos/order.dto';
import { formatPrice } from '@/lib/format-price';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { KeyboardEvent } from 'react';
import { toneFor } from './order-status';

interface OrderCardProps {
  order: OrderDto;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

// Card layout for the orders grid: number and customer up top, what was charged in the middle,
// status and age along the footer. The whole card opens the order; the overlay buttons stop there.
export default function OrderCard({ order, onView, onEdit, onDelete }: OrderCardProps) {
  const tone = toneFor(order.status);
  const items = order.items ?? [];
  const quantity = items.reduce((sum, item) => sum + (item.quantity ?? 0), 0);
  const customer = order.customer;
  const name = customer?.name || [customer?.firstName, customer?.lastName].filter(Boolean).join(' ');

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onView();
    }
  };

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onView}
      onKeyDown={onKeyDown}
      aria-label={`View order ${order.orderNumber}`}
      className={cn(
        '!p-0 group relative flex cursor-pointer flex-col overflow-hidden border transition-all duration-200',
        'hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
      )}
    >
      <div className="absolute right-2 top-2 z-10 flex gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100">
        <CardAction label="View order" icon={Eye} onClick={onView} className="hover:bg-primary hover:text-primary-foreground" />
        <CardAction label="Edit order" icon={Pencil} onClick={onEdit} className="hover:bg-primary hover:text-primary-foreground" />
        <CardAction label="Delete order" icon={Trash2} onClick={onDelete} className="hover:bg-destructive hover:text-destructive-foreground" />
      </div>

      <div className="space-y-3 p-4 pr-14">
        <div className="min-w-0">
          <p className="truncate font-mono text-sm font-semibold" title={order.orderNumber}>
            {order.orderNumber}
          </p>
          <p className="truncate text-[11px] text-muted-foreground">{name || 'Walk-in customer'}</p>
        </div>

        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="text-xl font-bold tabular-nums leading-none">{formatPrice(order.grandTotal ?? 0)}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {items.length} {items.length === 1 ? 'product' : 'products'} · {quantity} qty
            </p>
          </div>
          {order.discount > 0 && (
            <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
              −{formatPrice(order.discount)}
            </span>
          )}
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 border-t px-4 py-2.5 text-[11px]">
        <span className={cn('inline-flex items-center gap-1.5 font-medium', tone.text)}>
          <span className={cn('h-1.5 w-1.5 rounded-full', tone.dot)} />
          {tone.label}
        </span>
        <span className="truncate text-muted-foreground" title={order.createdAt ? new Date(order.createdAt).toLocaleString() : undefined}>
          {order.createdAt ? formatDistanceToNow(new Date(order.createdAt), { addSuffix: true }) : '—'}
        </span>
      </div>
    </Card>
  );
}
