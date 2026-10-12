'use client';
import ConfirmBox from '@/components/common/confirm-box';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from '@/components/ui/use-toast';
import { formatPrice } from '@/lib/format-price';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ArrowRight, Ban, ImageOff, Minus, PauseCircle, Plus, ShoppingCart, Timer, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { HeldOrder, PosCartLine } from './types';

interface CartPanelProps {
  lines: PosCartLine[];
  held: HeldOrder[];
  totals: { units: number; subtotal: number };
  setQuantity: (variantId: number, quantity: number) => void;
  removeLine: (variantId: number) => void;
  onCancel: () => void;
  onHold: () => void;
  onResume: (id: string) => void;
  onDiscardHeld: (id: string) => void;
  onCheckout: () => void;
}

export default function CartPanel({ lines, held, totals, setQuantity, removeLine, onCancel, onHold, onResume, onDiscardHeld, onCheckout }: CartPanelProps) {
  const [confirmCancel, setConfirmCancel] = useState(false);
  const empty = lines.length === 0;

  return (
    <aside className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
        <h2 className="flex items-center gap-2 text-sm font-bold">
          <ShoppingCart className="h-4 w-4 text-primary" />
          Current order
          {totals.units > 0 && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-primary">{totals.units}</span>}
        </h2>

        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5" disabled={held.length === 0}>
              <Timer className="h-3.5 w-3.5" />
              Held
              <span className="tabular-nums">{held.length}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Held orders</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {held.map((order) => (
              <DropdownMenuItem key={order.id} className="cursor-pointer items-start gap-2" onSelect={() => onResume(order.id)}>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium">{order.label}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {formatDistanceToNow(new Date(order.heldAt), { addSuffix: true })} \· {formatPrice(order.lines.reduce((n, l) => n + l.quantity * l.unitPrice, 0))}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                  aria-label="Discard held order"
                  onClick={(event) => {
                    event.stopPropagation();
                    onDiscardHeld(order.id);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
        {empty ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 py-10 text-center">
            <ShoppingCart className="h-8 w-8 text-muted-foreground/30" />
            <p className="text-sm font-medium">No items yet</p>
            <p className="max-w-[220px] text-xs text-muted-foreground">Tap a product on the left to add it to the order.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border/60">
            {lines.map((line) => (
              <li key={line.variantId} className="flex items-center gap-2.5 py-2.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted/40">
                  {line.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={line.image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <ImageOff className="h-4 w-4 text-muted-foreground/40" />
                  )}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold" title={line.name}>
                    {line.name}
                  </p>
                  <p className="text-[11px] tabular-nums text-muted-foreground">
                    {formatPrice(line.unitPrice)} \× {line.quantity}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <Button type="button" variant="outline" size="icon" className="h-6 w-6" aria-label="Decrease quantity" onClick={() => setQuantity(line.variantId, line.quantity - 1)}>
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-6 text-center text-xs font-bold tabular-nums">{line.quantity}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-6 w-6"
                    aria-label="Increase quantity"
                    disabled={line.quantity >= line.stock}
                    onClick={() => setQuantity(line.variantId, line.quantity + 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>

                <div className="w-16 shrink-0 text-right">
                  <p className="text-xs font-bold tabular-nums">{formatPrice(line.unitPrice * line.quantity)}</p>
                  <button type="button" className="text-[10px] text-muted-foreground hover:text-destructive hover:underline" onClick={() => removeLine(line.variantId)}>
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="shrink-0 space-y-3 border-t bg-muted/30 p-3">
        <div className="flex items-baseline justify-between">
          <span className="text-xs text-muted-foreground">Subtotal \· {totals.units} {totals.units === 1 ? 'item' : 'items'}</span>
          <span className="text-lg font-bold tabular-nums">{formatPrice(totals.subtotal)}</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button type="button" variant="outline" className="h-9 gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive" disabled={empty} onClick={() => setConfirmCancel(true)}>
            <Ban className="h-4 w-4" />
            Cancel order
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-9 gap-1.5"
            disabled={empty}
            onClick={() => {
              onHold();
              toast({ variant: 'success', title: 'Order held', description: <span>Pick it up again from the Held list.</span> });
            }}
          >
            <PauseCircle className="h-4 w-4" />
            Hold order
          </Button>
        </div>

        <Button type="button" className={cn('h-11 w-full gap-2 text-sm font-bold')} disabled={empty} onClick={onCheckout}>
          Take payment
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      {confirmCancel && (
        <ConfirmBox
          isOpen={confirmCancel}
          onClose={() => setConfirmCancel(false)}
          onSubmit={() => {
            onCancel();
            setConfirmCancel(false);
            toast({ variant: 'success', title: 'Order cancelled' });
          }}
          heading="Cancel this order?"
          yesButtonText="Yes, cancel it"
          bodyText="Every item on the current order will be removed. Held orders are not touched."
        />
      )}
    </aside>
  );
}
