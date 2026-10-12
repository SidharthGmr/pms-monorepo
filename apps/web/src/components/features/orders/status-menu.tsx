'use client';
import ConfirmBox from '@/components/common/confirm-box';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from '@/components/ui/use-toast';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { OrderDto } from '@/dtos/order.dto';
import { OrderStatus } from '@/enums/order-status.enum';
import { useUpdateOrderStatus } from '@/hooks/service-hooks/useOrderService';
import { cn } from '@/lib/utils';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { Check, ChevronDown, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { ORDER_STATUS_TONE, toneFor } from './order-status';

// The order of the workflow, not of the enum: a dispatcher reads down this list.
const STATUS_FLOW: OrderStatus[] = [OrderStatus.Pending, OrderStatus.Confirmed, OrderStatus.Shipped, OrderStatus.Delivered, OrderStatus.Cancelled, OrderStatus.Returned];

// Cancelling or returning is not part of walking an order forward, and both are awkward to undo
// once stock and money have been reconciled against them, so they ask first.
const NEEDS_CONFIRMATION: OrderStatus[] = [OrderStatus.Cancelled, OrderStatus.Returned];

interface OrderStatusMenuProps {
  order: OrderDto;
  /** `chip` matches the read-only badge it replaces; `block` fills the width of a card footer. */
  size?: 'chip' | 'block';
  className?: string;
}

// The status badge, made editable in place. It keeps the tone of the badge it replaces so a
// glance down the list reads exactly as before - only the chevron says it can be changed.
export default function OrderStatusMenu({ order, size = 'chip', className }: OrderStatusMenuProps) {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const mutation = useUpdateOrderStatus();
  const [pending, setPending] = useState<OrderStatus | null>(null);
  const [confirming, setConfirming] = useState<OrderStatus | null>(null);

  const current = String(order.status ?? '').toUpperCase() as OrderStatus;
  const tone = toneFor(order.status);

  const apply = async (status: OrderStatus) => {
    setPending(status);
    const response = await mutation.mutateAsync({ id: order.id, model: { status } });
    setPending(null);

    if (response && response.status === 200) {
      toast({ variant: 'success', title: `${order.orderNumber} marked ${ORDER_STATUS_TONE[status]?.label ?? status}` });
    } else {
      const error = unitOfService.ErrorHandlerService.getErrorMessage(response);
      toast({ variant: 'destructive', title: 'Could not update status', description: <span>{error}</span> });
    }
  };

  const select = (status: OrderStatus) => {
    if (status === current) return;
    if (NEEDS_CONFIRMATION.includes(status)) {
      setConfirming(status);
      return;
    }
    void apply(status);
  };

  const busy = mutation.isPending && pending !== null;

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            disabled={busy}
            onClick={(event) => event.stopPropagation()}
            aria-label={`Change status of ${order.orderNumber}, currently ${tone.label}`}
            title="Change status"
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full text-[11px] font-semibold transition-colors disabled:opacity-60',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
              size === 'block' ? 'px-2 py-0.5' : 'px-2 py-0.5',
              tone.soft,
              tone.text,
              'hover:brightness-95 data-[state=open]:ring-2 data-[state=open]:ring-ring dark:hover:brightness-125',
              className
            )}
          >
            {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <span className={cn('h-1.5 w-1.5 rounded-full', tone.dot)} />}
            {busy ? (ORDER_STATUS_TONE[pending as OrderStatus]?.label ?? 'Saving') : tone.label}
            <ChevronDown className="h-3 w-3 opacity-60" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-48" onClick={(event) => event.stopPropagation()}>
          <DropdownMenuLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Move to</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {STATUS_FLOW.map((status) => {
            const option = ORDER_STATUS_TONE[status];
            const isCurrent = status === current;
            return (
              <DropdownMenuItem key={status} className="cursor-pointer gap-2" disabled={isCurrent} onSelect={() => select(status)}>
                <span className={cn('h-2 w-2 shrink-0 rounded-full', option?.dot)} />
                <span className="flex-1">{option?.label ?? status}</span>
                {isCurrent && <Check className="h-3.5 w-3.5 text-muted-foreground" />}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {confirming && (
        <ConfirmBox
          isOpen={!!confirming}
          onClose={() => setConfirming(null)}
          onSubmit={() => {
            const next = confirming;
            setConfirming(null);
            void apply(next);
          }}
          heading={`Mark ${ORDER_STATUS_TONE[confirming]?.label ?? confirming}?`}
          yesButtonText={`Yes, mark ${(ORDER_STATUS_TONE[confirming]?.label ?? confirming).toLowerCase()}`}
          loading={mutation.isPending}
          bodyText={`Invoice ${order.orderNumber} will be marked ${(ORDER_STATUS_TONE[confirming]?.label ?? confirming).toLowerCase()}. Stock is not returned automatically - adjust it from Receive stock if the goods come back.`}
        />
      )}
    </>
  );
}
