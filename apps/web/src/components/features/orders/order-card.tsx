'use client';

import CardAction from '@/components/common/card-action';
import { Card } from '@/components/ui/card';
import { OrderDto } from '@/dtos/order.dto';
import { formatPrice } from '@/lib/format-price';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { KeyboardEvent } from 'react';
import { toneFor } from './order-status';

interface OrderCardProps {
  order: OrderDto;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

// Each card is a small invoice: number and status along the top rule, who it was billed to,
// the amount in the middle, the issue date along the foot. The whole card opens the document.
export default function OrderCard({ order, onView, onEdit, onDelete }: OrderCardProps) {
  const tone = toneFor(order.status);
  const items = order.items ?? [];
  const quantity = items.reduce((sum, item) => sum + (item.quantity ?? 0), 0);
  const customer = order.customer;
  const name = customer?.name || [customer?.firstName, customer?.lastName].filter(Boolean).join(' ');
  const issued = order.createdAt ? new Date(order.createdAt) : null;

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
      aria-label={`Open invoice ${order.orderNumber}`}
      className={cn(
        '!p-0 group relative flex cursor-pointer flex-col overflow-hidden border transition-all duration-200',
        'hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
      )}
    >
      {/* The document's top rule, in the status's own colour. */}
      <span aria-hidden className={cn('h-1 w-full', tone.dot)} />

      <div className="absolute right-2 top-3 z-10 flex gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100">
        <CardAction label="Open invoice" icon={Eye} onClick={onView} className="hover:bg-primary hover:text-primary-foreground" />
        <CardAction label="Edit invoice" icon={Pencil} onClick={onEdit} className="hover:bg-primary hover:text-primary-foreground" />
        <CardAction label="Delete invoice" icon={Trash2} onClick={onDelete} className="hover:bg-destructive hover:text-destructive-foreground" />
      </div>

      <div className="space-y-3 p-4 pr-14">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Invoice</p>
          <p className="truncate font-mono text-sm font-semibold" title={order.orderNumber}>
            {order.orderNumber}
          </p>
        </div>

        <div className="min-w-0 border-t border-dashed pt-2.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Billed to</p>
          <p className="truncate text-xs font-medium" title={name || undefined}>
            {name || 'Walk-in customer'}
          </p>
        </div>

        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="text-xl font-bold tabular-nums leading-none">{formatPrice(order.grandTotal ?? 0)}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {items.length} {items.length === 1 ? 'line' : 'lines'} · {quantity} qty
            </p>
          </div>
          {order.discount > 0 && (
            <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
              −{formatPrice(order.discount)}
            </span>
          )}
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 border-t bg-muted/30 px-4 py-2.5 text-[11px]">
        <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-semibold', tone.soft, tone.text)}>
          <span className={cn('h-1.5 w-1.5 rounded-full', tone.dot)} />
          {tone.label}
        </span>
        <span className="truncate tabular-nums text-muted-foreground" title={issued ? formatDistanceToNow(issued, { addSuffix: true }) : undefined}>
          {issued ? format(issued, 'd MMM yyyy') : '—'}
        </span>
      </div>
    </Card>
  );
}
