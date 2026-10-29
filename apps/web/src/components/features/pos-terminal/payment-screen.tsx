'use client';
import { SelectSearch } from '@/components/common/select-search';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';

import { useCreateOrder } from '@/hooks/service-hooks/useOrderService';
import { useGetAllUserList } from '@/hooks/service-hooks/useUserList.service.hook';
import { formatPrice } from '@/lib/format-price';
import { cn } from '@/lib/utils';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { ArrowLeft, Banknote, CheckCircle2, CreditCard, ImageOff, Printer, QrCode, ReceiptText } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { PaymentMethod, PosCartLine } from './types';
import { OrderStatusEnum } from '@pms/types';
const METHODS: { value: PaymentMethod; label: string; icon: typeof Banknote }[] = [
  { value: 'CASH', label: 'Cash', icon: Banknote },
  { value: 'UPI', label: 'UPI', icon: QrCode },
  { value: 'CARD', label: 'Card', icon: CreditCard },
];

interface PaymentScreenProps {
  lines: PosCartLine[];
  onBack: () => void;
  /** Clears the till once the order is on the books. */
  onComplete: () => void;
}

export default function PaymentScreen({ lines, onBack, onComplete }: PaymentScreenProps) {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const createOrder = useCreateOrder();
  const { data: customersResponse } = useGetAllUserList({ role: 'USER', recordPerPage: 200 });

  const [customerId, setCustomerId] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('CASH');
  const [discount, setDiscount] = useState('');
  const [received, setReceived] = useState('');
  const [notes, setNotes] = useState('');
  const [placed, setPlaced] = useState<{ id: number; orderNumber: string } | null>(null);

  const customerOptions = useMemo(
    () =>
      (customersResponse?.data?.data?.data || [])
        .map((customer) => {
          // API returns the GUID under `userId`; the DTO mislabels it `usersId`.
          const cid = ((customer as unknown as { userId?: string }).userId ?? (customer as unknown as { usersId?: string }).usersId ?? '') as string;
          return { label: customer.email ? `${customer.name} (${customer.email})` : customer.name, value: cid };
        })
        .filter((option) => option.value),
    [customersResponse]
  );

  const subtotal = lines.reduce((n, line) => n + line.quantity * line.unitPrice, 0);
  const units = lines.reduce((n, line) => n + line.quantity, 0);
  const discountAmount = Math.min(Math.max(Number(discount) || 0, 0), subtotal);
  const grandTotal = subtotal - discountAmount;
  const receivedAmount = Number(received) || 0;
  const change = method === 'CASH' && receivedAmount > grandTotal ? receivedAmount - grandTotal : 0;
  const cashShort = method === 'CASH' && received !== '' && receivedAmount < grandTotal;

  const placeOrder = async () => {
    if (!customerId) {
      toast({ variant: 'destructive', title: 'Pick a customer', description: <span>Every order is billed to a customer account.</span> });
      return;
    }

    const response = await createOrder.mutateAsync({
      customerId,
      discount: discountAmount,
      tax: 0,
      shippingCost: 0,
      status: OrderStatusEnum.Confirmed,
      notes: [`POS sale · paid by ${method}`, notes.trim()].filter(Boolean).join('\n'),
      items: lines.map((line) => ({ variantId: line.variantId, quantity: line.quantity })),
    });

    if (response && response.status === 201 && response.data?.data) {
      setPlaced({ id: response.data.data.id, orderNumber: response.data.data.orderNumber });
      onComplete();
    } else {
      const message = unitOfService.ErrorHandlerService.getErrorMessage(response);
      toast({ variant: 'destructive', title: 'Could not place the order', description: <span>{message}</span> });
    }
  };

  if (placed) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="w-full max-w-md space-y-4 rounded-2xl border bg-card p-8 text-center shadow-sm">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-7 w-7" />
          </span>
          <div>
            <h2 className="text-lg font-bold">Payment recorded</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Invoice <span className="font-mono font-semibold text-foreground">{placed.orderNumber}</span> · {formatPrice(grandTotal)} by {method}
              {change > 0 && (
                <>
                  {' '}
                  · change <span className="font-semibold text-foreground">{formatPrice(change)}</span>
                </>
              )}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button asChild variant="outline" className="h-10 gap-1.5">
              <Link href={`/admin/orders/${placed.id}`}>
                <Printer className="h-4 w-4" />
                Open invoice
              </Link>
            </Button>
            <Button type="button" onClick={onBack}>
              New sale
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Button type="button" variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={onBack}>
        <ArrowLeft className="h-4 w-4" />
        Back to the till
      </Button>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_400px]">
        {/* The menu: what this order is, read-only, so the cashier confirms against the counter. */}
        <section className="order-2 overflow-hidden rounded-xl border bg-card shadow-sm lg:order-none">
          <div className="flex items-center gap-2 border-b px-4 py-3">
            <ReceiptText className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold">Order menu</h2>
            <span className="ml-auto text-xs tabular-nums text-muted-foreground">
              {units} {units === 1 ? 'item' : 'items'}
            </span>
          </div>

          <ul className="divide-y divide-border/60 px-4">
            {lines.map((line) => (
              <li key={line.variantId} className="flex items-center gap-3 py-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted/40">
                  {line.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={line.image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <ImageOff className="h-4 w-4 text-muted-foreground/40" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold">{line.name}</p>
                  <p className="text-[11px] tabular-nums text-muted-foreground">
                    {formatPrice(line.unitPrice)} × {line.quantity}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-bold tabular-nums">{formatPrice(line.unitPrice * line.quantity)}</span>
              </li>
            ))}
          </ul>

          <dl className="space-y-1.5 border-t bg-muted/30 px-4 py-3 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <dt>Subtotal</dt>
              <dd className="tabular-nums">{formatPrice(subtotal)}</dd>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <dt>Discount</dt>
                <dd className="tabular-nums">−{formatPrice(discountAmount)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-border/70 pt-1.5 text-base font-bold">
              <dt>To pay</dt>
              <dd className="tabular-nums">{formatPrice(grandTotal)}</dd>
            </div>
          </dl>
        </section>

        <section className="order-1 space-y-4 rounded-xl border bg-card p-4 shadow-sm lg:order-none">
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Customer *</label>
            <div className="mt-1.5">
              <SelectSearch
                items={customerOptions}
                value={customerId}
                valueType="string"
                containerName="pos-customer"
                buttonClass="w-full h-10 font-normal"
                placeholder="Search customer by name or email"
                onChange={(value) => setCustomerId(String(value ?? ''))}
              />
            </div>
          </div>

          <div>
            <span className="text-xs font-semibold text-muted-foreground">Payment method</span>
            <div className="mt-1.5 grid grid-cols-3 gap-2" role="radiogroup" aria-label="Payment method">
              {METHODS.map(({ value, label, icon: Icon }) => {
                const active = method === value;
                return (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setMethod(value)}
                    className={cn(
                      'flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-xs font-semibold transition-colors',
                      active ? 'border-primary bg-primary/10 text-primary' : 'text-muted-foreground hover:border-primary/40 hover:text-foreground'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground" htmlFor="pos-discount">
                Discount
              </label>
              <Input
                id="pos-discount"
                type="number"
                min={0}
                inputMode="decimal"
                placeholder="0"
                value={discount}
                onChange={(event) => setDiscount(event.target.value)}
                className="mt-1.5 h-10 tabular-nums"
              />
            </div>
            {method === 'CASH' && (
              <div>
                <label className="text-xs font-semibold text-muted-foreground" htmlFor="pos-received">
                  Cash received
                </label>
                <Input
                  id="pos-received"
                  type="number"
                  min={0}
                  inputMode="decimal"
                  placeholder={String(grandTotal)}
                  value={received}
                  onChange={(event) => setReceived(event.target.value)}
                  className="mt-1.5 h-10 tabular-nums"
                />
              </div>
            )}
          </div>

          {method === 'CASH' && received !== '' && (
            <p
              className={cn(
                'rounded-lg px-3 py-2 text-xs font-semibold tabular-nums',
                cashShort ? 'bg-destructive/10 text-destructive' : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
              )}
            >
              {cashShort ? `Short by ${formatPrice(grandTotal - receivedAmount)}` : `Change to return: ${formatPrice(change)}`}
            </p>
          )}

          <div>
            <label className="text-xs font-semibold text-muted-foreground" htmlFor="pos-notes">
              Note
            </label>
            <Textarea
              id="pos-notes"
              rows={2}
              placeholder="Optional, lands on the invoice"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="mt-1.5 resize-none"
            />
          </div>

          <Button
            type="button"
            className="h-12 w-full gap-2 text-sm font-bold"
            loading={createOrder.isPending}
            disabled={cashShort}
            onClick={placeOrder}
          >
            Confirm · {formatPrice(grandTotal)}
          </Button>
        </section>
      </div>
    </div>
  );
}
