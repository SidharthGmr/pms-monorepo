'use client';

import OrderWhatsApp from '@/components/common/OrderWhatsApp';
import OrderItemReviewCell from '@/components/features/reviews/order-item-review-cell';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { OrderItemDto } from '@/dtos/order-item.dto';
import { useGetOrderById } from '@/hooks/service-hooks/useOrderService';
import { useGetAllReviews } from '@/hooks/service-hooks/useReviewService';
import useGetCurrentUser from '@/hooks/useGetCurrentUser';
import { formatPrice } from '@/lib/format-price';
import { cn } from '@/lib/utils';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import {
  AlertTriangle,
  ArrowLeft,
  BadgeAlert,
  Check,
  CheckCircle2,
  Copy,
  Download,
  Edit2,
  FileText,
  HelpCircle,
  Mail,
  Package,
  Phone,
  Receipt,
  ShoppingBag,
  Truck,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { ReactNode, useState } from 'react';
import ManageOrder from './add-edit';
import BillReceipt from './bill-receipt';
import { amountInWords, downloadInvoicePdf } from './invoice-pdf';

interface OrderDetailsViewProps {
  id: number;
  onEdit?: (id: number) => void;
}

const SURFACE = 'rounded-xl border border-border/70 bg-card text-card-foreground shadow-sm';
const LABEL = 'text-[10px] font-bold uppercase tracking-widest text-muted-foreground';

const STATUS: Record<string, { label: string; tone: string; dot: string; icon: ReactNode }> = {
  PENDING: { label: 'Pending', tone: 'bg-amber-500/10 text-amber-700 dark:text-amber-400', dot: 'bg-amber-500', icon: <HelpCircle className="h-4 w-4" /> },
  CONFIRMED: { label: 'Confirmed', tone: 'bg-sky-500/10 text-sky-700 dark:text-sky-400', dot: 'bg-sky-500', icon: <Package className="h-4 w-4" /> },
  SHIPPED: { label: 'Shipped', tone: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400', dot: 'bg-indigo-500', icon: <Truck className="h-4 w-4" /> },
  DELIVERED: { label: 'Delivered', tone: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500', icon: <CheckCircle2 className="h-4 w-4" /> },
  CANCELLED: { label: 'Cancelled', tone: 'bg-rose-500/10 text-rose-700 dark:text-rose-400', dot: 'bg-rose-500', icon: <AlertTriangle className="h-4 w-4" /> },
  RETURNED: { label: 'Returned', tone: 'bg-orange-500/10 text-orange-700 dark:text-orange-400', dot: 'bg-orange-500', icon: <ArrowLeft className="h-4 w-4" /> },
};

const TIMELINE: { key: string; label: string; hint: string; icon: ReactNode }[] = [
  { key: 'PENDING', label: 'Placed', hint: 'Order recorded', icon: <Receipt className="h-3 w-3" /> },
  { key: 'CONFIRMED', label: 'Confirmed', hint: 'Accepted for fulfilment', icon: <Package className="h-3 w-3" /> },
  { key: 'SHIPPED', label: 'Shipped', hint: 'Handed to the courier', icon: <Truck className="h-3 w-3" /> },
  { key: 'DELIVERED', label: 'Delivered', hint: 'Received by the customer', icon: <CheckCircle2 className="h-3 w-3" /> },
];

/**
 * The order read as the document it is: who it is from and to at the top, the lines in the
 * middle, what is owed at the end. Everything about the order rather than on it - where it has
 * got to, what can be done with it, its notes - sits in the column on the right.
 */
export default function OrderDetailsView({ id, onEdit }: OrderDetailsViewProps) {
  const router = useRouter();
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const { data: response, isLoading, isError } = useGetOrderById(id);
  const order = response?.data?.data;

  // Rating is only offered to the buyer looking at their own order - the API rejects a
  // review for anyone else's order, so showing the control to staff would just 403.
  const { currentUser } = useGetCurrentUser();
  const isOwnOrder = !!order?.customerId && !!currentUser?.usersId && order.customerId === currentUser.usersId;
  const { data: reviewsResponse } = useGetAllReviews({ orderId: id }, isOwnOrder);
  const myReviews = reviewsResponse?.data?.data?.data ?? [];

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const generatePdf = async () => {
    if (!order) return;
    try {
      setIsGeneratingPdf(true);
      // Yield once so the button can paint its loading state before the synchronous draw.
      await new Promise((resolve) => setTimeout(resolve, 0));
      downloadInvoicePdf(order);
    } catch (error) {
      console.error('Failed to generate PDF', error);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(label);
    setTimeout(() => setCopiedId(null), 1500);
  };

  if (isLoading) return <OrderDetailsSkeleton />;

  if (isError || !order) {
    return (
      <div className={cn(SURFACE, 'mx-auto max-w-xl px-6 py-12 text-center')}>
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <BadgeAlert className="h-7 w-7" />
        </div>
        <h3 className="text-lg font-bold tracking-tight">Could not load this order</h3>
        <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">The order may not exist, or your account may not have access to it.</p>
        <Button variant="outline" className="mt-5" onClick={() => router.push('/admin/orders')}>
          <ArrowLeft className="h-4 w-4" />
          Back to orders
        </Button>
      </div>
    );
  }

  const statusKey = order.status?.toUpperCase() || 'PENDING';
  const status = STATUS[statusKey] ?? { label: order.status, tone: 'bg-muted text-muted-foreground', dot: 'bg-muted-foreground', icon: <HelpCircle className="h-4 w-4" /> };
  const stepIndex = TIMELINE.findIndex((s) => s.key === statusKey);
  const isClosedStatus = statusKey === 'CANCELLED' || statusKey === 'RETURNED';
  const datePlaced = order.createdAt ? unitOfService.DateTimeService.convertToLocalDate(order.createdAt, true) : '—';

  const items = (order.items ?? []) as OrderItemDto[];
  const totalQuantity = items.reduce((n, item) => n + (item.quantity ?? 0), 0);
  const customerName = order.customer?.name || [order.customer?.firstName, order.customer?.lastName].filter(Boolean).join(' ') || 'Walk-in customer';
  const storeName = order.store?.name?.split(' - ')[0] || 'Store';
  const customerSearch = order.customer?.email || order.customer?.phone || '';

  return (
    <div className="space-y-4 animate-in fade-in duration-300 sm:space-y-5">
      <Link href="/admin/orders" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" />
        All orders
      </Link>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 sm:gap-5">
        {/* The document itself. */}
        <section className={cn(SURFACE, 'min-w-0 overflow-hidden lg:col-span-2')}>
          <div className="border-b border-border/70 bg-gradient-to-r from-primary/[0.07] via-primary/[0.03] to-transparent">
            <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
            <div className="flex min-w-0 items-center gap-3.5">
              <span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:flex">
                <Receipt className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className={LABEL}>Invoice</p>
                <h1 className="truncate font-mono text-xl font-bold tracking-tight sm:text-2xl">{order.orderNumber}</h1>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {datePlaced}
                  {order.createdByName ? ` · billed by ${order.createdByName}` : ''}
                </p>
              </div>
            </div>

            <div className="shrink-0 text-left sm:text-right">
              <p className={LABEL}>Amount payable</p>
              <p className="text-2xl font-bold tabular-nums leading-tight text-primary">{formatPrice(order.grandTotal)}</p>
              <p className="text-[11px] text-muted-foreground">
                {items.length} {items.length === 1 ? 'product' : 'products'} · {totalQuantity} qty
              </p>
            </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t border-border/50 px-4 py-2.5 sm:px-5">
              <Button variant="outline" size="sm" className="h-8 gap-1.5 bg-background/60" onClick={generatePdf} disabled={isGeneratingPdf}>
                <Download className={cn('h-3.5 w-3.5', isGeneratingPdf && 'animate-bounce')} />
                {isGeneratingPdf ? 'Generating…' : 'PDF'}
              </Button>

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 gap-1.5 bg-background/60">
                    <FileText className="h-3.5 w-3.5" />
                    Bill
                  </Button>
                </DialogTrigger>
                <DialogContent className="flex max-h-[92vh] max-w-[900px] flex-col gap-0 p-0" onInteractOutside={(e) => e.preventDefault()}>
                  <DialogHeader className="flex flex-row items-center justify-between space-y-0 border-b px-5 py-3.5 pr-14 text-left">
                    <div className="min-w-0">
                      <DialogTitle className="text-base">Invoice {order.orderNumber}</DialogTitle>
                      <p className="text-xs text-muted-foreground">A4 preview of what downloads.</p>
                    </div>
                    <Button size="sm" className="h-9 gap-1.5" onClick={generatePdf} disabled={isGeneratingPdf}>
                      <Download className={cn('h-4 w-4', isGeneratingPdf && 'animate-bounce')} />
                      {isGeneratingPdf ? 'Generating…' : 'Download PDF'}
                    </Button>
                  </DialogHeader>

                  {/* The sheet is 794px wide; the wrapper scales it down so the whole width is visible
                      without a horizontal scrollbar, and reserves the height the scaling gives back. */}
                  <div className="min-h-0 flex-1 overflow-y-auto bg-muted/40 p-5">
                    <div className="mx-auto w-[794px] origin-top scale-[0.95] shadow-lg">
                      <BillReceipt order={order} />
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <OrderWhatsApp order={order} />

              {/* Without a host-supplied handler the page opens the edit dialog itself, so the
                  action is reachable from the order's own URL and not only from the list. */}
              <Button size="sm" className="ml-auto h-8 gap-1.5" onClick={() => (onEdit ? onEdit(order.id) : setShowEdit(true))}>
                <Edit2 className="h-3.5 w-3.5" />
                Edit
              </Button>
            </div>
          </div>

          {/* Who it is from and who it is for, the way an invoice opens. */}
          <div className="grid grid-cols-1 gap-px bg-border/70 sm:grid-cols-2">
            <div className="bg-card px-4 py-3.5 sm:px-5">
              <p className={LABEL}>From</p>
              <div className="mt-1.5 flex items-baseline gap-2">
                <p className="min-w-0 truncate text-sm font-bold" title={storeName}>
                  {storeName}
                </p>
                <CopyInline label="Store code" value={order.storeCode} copied={copiedId === 'store'} onCopy={() => copyToClipboard(order.storeCode, 'store')} />
              </div>
              {(order.store?.address || order.store?.phone || order.store?.email) && (
                <ul className="mt-1.5 space-y-1 text-xs text-muted-foreground">
                  {order.store?.address && <li className="leading-relaxed">{order.store.address}</li>}
                  {(order.store?.phone || order.store?.email) && (
                    <li className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      {order.store?.phone && (
                        <a href={`tel:${order.store.phone}`} className="inline-flex items-center gap-1.5 hover:text-foreground hover:underline">
                          <Phone className="h-3 w-3 shrink-0" />
                          {order.store.phone}
                        </a>
                      )}
                      {order.store?.email && (
                        <a href={`mailto:${order.store.email}`} className="inline-flex min-w-0 items-center gap-1.5 truncate hover:text-foreground hover:underline">
                          <Mail className="h-3 w-3 shrink-0" />
                          {order.store.email}
                        </a>
                      )}
                    </li>
                  )}
                </ul>
              )}
            </div>

            <div className="bg-card px-4 py-3.5 sm:px-5">
              <div className="flex items-center justify-between gap-2">
                <p className={LABEL}>Bill to</p>
                {customerSearch && (
                  <Link
                    href={`/admin/orders?search=${encodeURIComponent(customerSearch)}`}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                  >
                    <ShoppingBag className="h-3 w-3" />
                    Their other orders
                  </Link>
                )}
              </div>
              <div className="mt-1.5 flex items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold uppercase text-primary">{customerName.slice(0, 2)}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <p className="min-w-0 truncate text-sm font-bold" title={customerName}>
                      {customerName}
                    </p>
                    <CopyInline label="Customer ID" value={order.customerId} copied={copiedId === 'cust'} onCopy={() => copyToClipboard(order.customerId, 'cust')} />
                  </div>
                  {(order.customer?.email || order.customer?.phone) && (
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      {order.customer?.email && (
                        <a href={`mailto:${order.customer.email}`} className="inline-flex min-w-0 items-center gap-1.5 truncate hover:text-foreground hover:underline">
                          <Mail className="h-3 w-3 shrink-0" />
                          {order.customer.email}
                        </a>
                      )}
                      {order.customer?.phone && (
                        <a href={`tel:${order.customer.phone}`} className="inline-flex items-center gap-1.5 hover:text-foreground hover:underline">
                          <Phone className="h-3 w-3 shrink-0" />
                          {order.customer.phone}
                        </a>
                      )}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Line items, as an invoice table rather than a stack of rows. */}
          <div className="border-t border-border/70">
            {items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-center text-sm text-muted-foreground">
                <ShoppingBag className="h-8 w-8 text-muted-foreground/40" />
                No items are recorded on this order.
              </div>
            ) : (
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-border/70 bg-muted/40">
                    <th className={cn(LABEL, 'px-4 py-2.5 sm:px-5')}>Description</th>
                    <th className={cn(LABEL, 'hidden w-28 px-2 py-2.5 text-right sm:table-cell')}>Rate</th>
                    <th className={cn(LABEL, 'w-16 px-2 py-2.5 text-center')}>Qty</th>
                    <th className={cn(LABEL, 'w-28 px-4 py-2.5 text-right sm:px-5')}>Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/70">
                  {items.map((item) => {
                    const image = item.variant?.images?.[0] ?? item.product?.images?.[0];
                    const name = item.product?.name ?? `Product #${item.productId}`;
                    const variantLabel = item.variant?.name && item.variant.name !== name ? item.variant.name.replace(`${name} - `, '') : null;

                    return (
                      <tr key={item.id} className="align-top">
                        <td className="px-4 py-3 sm:px-5">
                          <div className="flex items-start gap-3">
                            <Link href={`/admin/products/${item.productId}`} className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted/40">
                              {image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={image} alt="" className="h-full w-full object-cover" />
                              ) : (
                                <Package className="h-4 w-4 text-muted-foreground/40" />
                              )}
                            </Link>
                            <div className="min-w-0">
                              <Link href={`/admin/products/${item.productId}`} className="line-clamp-2 text-sm font-semibold hover:underline" title={name}>
                                {name}
                              </Link>
                              <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
                                {variantLabel && <span className="rounded bg-muted px-1.5 py-0.5 font-medium text-foreground/80">{variantLabel}</span>}
                                {item.variant?.sku && <span className="font-mono">{item.variant.sku}</span>}
                                <span className="tabular-nums sm:hidden">{formatPrice(item.unitPrice)} each</span>
                              </p>
                              {isOwnOrder && (
                                <div className="mt-1.5">
                                  <OrderItemReviewCell orderId={order.id} productId={item.productId} productName={name} reviews={myReviews} />
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="hidden px-2 py-3 text-right text-sm tabular-nums text-muted-foreground sm:table-cell">{formatPrice(item.unitPrice)}</td>
                        <td className="px-2 py-3 text-center text-sm tabular-nums text-muted-foreground">{item.quantity}</td>
                        <td className="px-4 py-3 text-right text-sm font-bold tabular-nums sm:px-5">{formatPrice(item.totalPrice ?? item.unitPrice * item.quantity)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Words on the left, what is owed on the right - the closing block of a bill. */}
          <div className="grid grid-cols-1 gap-4 border-t border-border/70 bg-muted/30 p-4 sm:p-5 lg:grid-cols-2">
            <div className="min-w-0">
              <p className={LABEL}>Amount in words</p>
              <p className="mt-1.5 text-sm font-medium leading-relaxed text-foreground/85">{amountInWords(order.grandTotal ?? 0)}</p>
            </div>

            <dl className="space-y-1.5 text-sm">
              <Line label="Subtotal" value={formatPrice(order.totalAmount)} />
              {order.discount > 0 && <Line label="Discount" value={`−${formatPrice(order.discount)}`} className="text-emerald-700 dark:text-emerald-400" />}
              {order.tax > 0 && <Line label="Tax" value={formatPrice(order.tax)} />}
              <Line
                label="Shipping & platform fee"
                value={order.shippingCost > 0 ? formatPrice(order.shippingCost) : 'Free'}
                className={cn(order.shippingCost === 0 && '[&>dd]:text-emerald-600 dark:[&>dd]:text-emerald-400')}
              />
              <div className="flex items-baseline justify-between border-t border-border/70 pt-2.5">
                <dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Grand total</dt>
                <dd className="text-xl font-bold tabular-nums text-primary">{formatPrice(order.grandTotal)}</dd>
              </div>
            </dl>
          </div>
        </section>

        {/* Everything about the order rather than on it. */}
        <aside className="min-w-0 space-y-4 sm:space-y-5">
          <section className={cn(SURFACE, 'overflow-hidden')}>
            <div className={cn('flex items-center gap-2.5 px-4 py-3 sm:px-5', status.tone)}>
              {status.icon}
              <div className="min-w-0">
                <p className="text-sm font-bold leading-tight">{status.label}</p>
                <p className="text-[11px] opacity-80">{isClosedStatus ? `This order was ${status.label.toLowerCase()}.` : 'Current stage of this order'}</p>
              </div>
            </div>

            {!isClosedStatus && (
              <ol className="p-4 sm:p-5">
                {TIMELINE.map((step, idx) => {
                  const done = idx < stepIndex;
                  const active = idx === stepIndex;
                  const last = idx === TIMELINE.length - 1;

                  return (
                    <li key={step.key} className="relative flex gap-3 pb-4 last:pb-0">
                      {!last && <span aria-hidden className={cn('absolute left-[11px] top-6 h-[calc(100%-18px)] w-0.5 rounded', done ? 'bg-primary' : 'bg-border')} />}
                      <span
                        className={cn(
                          'relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
                          done ? 'bg-primary text-primary-foreground' : active ? 'bg-primary/15 text-primary ring-2 ring-primary/30' : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {done ? <Check className="h-3 w-3" strokeWidth={3} /> : step.icon}
                      </span>
                      <div className="min-w-0 pt-0.5">
                        <p
                          className={cn('text-xs font-semibold leading-tight', active ? 'text-primary' : done ? 'text-foreground' : 'text-muted-foreground')}
                          aria-current={active ? 'step' : undefined}
                        >
                          {step.label}
                        </p>
                        <p className="text-[11px] text-muted-foreground">{step.hint}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}

          </section>

          <section className={cn(SURFACE, 'p-4 sm:p-5')}>
            <h2 className={cn(LABEL, 'mb-2.5')}>Order details</h2>
            <dl>
              <Fact label="Products" value={`${items.length} · ${totalQuantity} qty`} />
              <Fact label="Placed" value={datePlaced} />
              <Fact label="Billed by" value={order.createdByName || '—'} />
              <Fact label="Last updated" value={order.updatedAt ? unitOfService.DateTimeService.convertToLocalDate(order.updatedAt, true) : '—'} />
            </dl>
          </section>

          {order.notes && (
            <section className={cn(SURFACE, 'p-4 sm:p-5')}>
              <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <FileText className="h-4 w-4 text-primary" />
                Notes
              </h2>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">{order.notes}</p>
            </section>
          )}
        </aside>
      </div>

      {showEdit && <ManageOrder id={order.id} isOpen={showEdit} onClose={() => setShowEdit(false)} />}
    </div>
  );
}

/* ---------- building blocks ---------- */

function Line({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={cn('flex items-center justify-between gap-3', className)}>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium tabular-nums">{value}</dd>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-dashed border-border/70 py-2 last:border-0">
      <dt className="shrink-0 text-xs text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words text-right text-xs font-medium">{value}</dd>
    </div>
  );
}

function CopyInline({ label, value, copied, onCopy }: { label: string; value: string; copied: boolean; onCopy: () => void }) {
  return (
    <div className="mt-0.5 flex min-w-0 items-center gap-1 text-[11px] text-muted-foreground">
      <code className="min-w-0 truncate font-mono" title={value}>
        {value}
      </code>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button" onClick={onCopy} aria-label={`Copy ${label}`} className="flex h-5 w-5 shrink-0 items-center justify-center rounded hover:bg-muted hover:text-foreground">
              {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">{copied ? 'Copied' : `Copy ${label.toLowerCase()}`}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

// Mirrors the loaded layout block for block so nothing jumps when the data lands.
function OrderDetailsSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-5" aria-busy aria-label="Loading order">
      <Skeleton className="h-3 w-16" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 sm:gap-5">
        <div className={cn(SURFACE, 'overflow-hidden lg:col-span-2')}>
          <div className="flex items-start justify-between gap-4 border-b border-border/70 p-4 sm:p-5">
            <div className="flex items-center gap-3.5">
              <Skeleton className="hidden h-12 w-12 rounded-xl sm:block" />
              <div className="space-y-2">
                <Skeleton className="h-2.5 w-14" />
                <Skeleton className="h-7 w-44" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-2.5 w-20" />
              <Skeleton className="h-7 w-28" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-px bg-border/70 sm:grid-cols-2">
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="space-y-2 bg-card p-4 sm:p-5">
                <Skeleton className="h-2.5 w-12" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-40" />
                <Skeleton className="h-3 w-36" />
              </div>
            ))}
          </div>

          <div className="divide-y divide-border/70 border-t border-border/70">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3 p-4 sm:p-5">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 border-t border-border/70 bg-muted/30 p-4 sm:p-5 lg:grid-cols-2">
            <Skeleton className="h-10 w-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
          </div>
        </div>

        <div className="space-y-4 sm:space-y-5">
          <div className={cn(SURFACE, 'overflow-hidden')}>
            <Skeleton className="h-14 w-full rounded-none" />
            <div className="space-y-4 p-4 sm:p-5">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex gap-3">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-2.5 w-28" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className={cn(SURFACE, 'space-y-3 p-4 sm:p-5')}>
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-4 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
