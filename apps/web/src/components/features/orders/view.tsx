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
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
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
  Store,
  Truck,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { ReactNode, useRef, useState } from 'react';
import BillReceipt from './bill-receipt';

interface OrderDetailsViewProps {
  id: number;
  onEdit?: (id: number) => void;
}

const SURFACE = 'rounded-xl border border-border/70 bg-card text-card-foreground shadow-sm';

const STATUS: Record<string, { label: string; tone: string; dot: string; icon: ReactNode }> = {
  PENDING: { label: 'Pending', tone: 'bg-amber-500/10 text-amber-700 dark:text-amber-400', dot: 'bg-amber-500', icon: <HelpCircle className="h-3.5 w-3.5" /> },
  CONFIRMED: { label: 'Confirmed', tone: 'bg-sky-500/10 text-sky-700 dark:text-sky-400', dot: 'bg-sky-500', icon: <Package className="h-3.5 w-3.5" /> },
  SHIPPED: { label: 'Shipped', tone: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400', dot: 'bg-indigo-500', icon: <Truck className="h-3.5 w-3.5" /> },
  DELIVERED: { label: 'Delivered', tone: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  CANCELLED: { label: 'Cancelled', tone: 'bg-rose-500/10 text-rose-700 dark:text-rose-400', dot: 'bg-rose-500', icon: <AlertTriangle className="h-3.5 w-3.5" /> },
  RETURNED: { label: 'Returned', tone: 'bg-orange-500/10 text-orange-700 dark:text-orange-400', dot: 'bg-orange-500', icon: <ArrowLeft className="h-3.5 w-3.5" /> },
};

const TIMELINE: { key: string; label: string; icon: ReactNode }[] = [
  { key: 'PENDING', label: 'Placed', icon: <Receipt className="h-3.5 w-3.5" /> },
  { key: 'CONFIRMED', label: 'Confirmed', icon: <Package className="h-3.5 w-3.5" /> },
  { key: 'SHIPPED', label: 'Shipped', icon: <Truck className="h-3.5 w-3.5" /> },
  { key: 'DELIVERED', label: 'Delivered', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
];

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
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  const generatePdf = async () => {
    if (!receiptRef.current) return;
    try {
      setIsGeneratingPdf(true);
      const canvas = await html2canvas(receiptRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Order_Bill_${order?.orderNumber}.pdf`);
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
  const status = STATUS[statusKey] ?? { label: order.status, tone: 'bg-muted text-muted-foreground', dot: 'bg-muted-foreground', icon: <HelpCircle className="h-3.5 w-3.5" /> };
  const stepIndex = TIMELINE.findIndex((s) => s.key === statusKey);
  const isClosedStatus = statusKey === 'CANCELLED' || statusKey === 'RETURNED';
  const datePlaced = order.createdAt ? unitOfService.DateTimeService.convertToLocalDate(order.createdAt, true) : '—';

  const items = (order.items ?? []) as OrderItemDto[];
  const totalQuantity = items.reduce((n, item) => n + (item.quantity ?? 0), 0);
  const customerName = order.customer?.name || [order.customer?.firstName, order.customer?.lastName].filter(Boolean).join(' ') || 'Walk-in customer';
  const contact = [order.customer?.email, order.customer?.phone].filter(Boolean) as string[];
  const storeName = order.store?.name?.split(' - ')[0] || 'Store';

  return (
    <div className="space-y-4 animate-in fade-in duration-300 sm:space-y-5">
      <Link href="/admin/orders" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" />
        All orders
      </Link>

      <section className={cn(SURFACE, 'overflow-hidden')}>
        <div className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <span className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:flex">
              <Receipt className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-mono text-xl font-bold tracking-tight sm:text-2xl">{order.orderNumber}</h1>
                <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold', status.tone)}>
                  <span className={cn('h-1.5 w-1.5 rounded-full', status.dot)} />
                  {status.label}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Placed {datePlaced}
                {order.createdByName ? ` · by ${order.createdByName}` : ''}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 lg:justify-end">
            <div className="text-left lg:text-right">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Order total</p>
              <p className="text-2xl font-bold tabular-nums leading-tight text-primary">{formatPrice(order.grandTotal)}</p>
              <p className="text-[11px] text-muted-foreground">
                {items.length} {items.length === 1 ? 'product' : 'products'} · {totalQuantity} qty
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 gap-1.5">
                    <FileText className="h-4 w-4" />
                    Bill
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
                  <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <DialogTitle>Bill preview</DialogTitle>
                    <Button size="sm" onClick={generatePdf} disabled={isGeneratingPdf} className="mr-6">
                      <Download className={cn('h-4 w-4', isGeneratingPdf && 'animate-bounce')} />
                      {isGeneratingPdf ? 'Generating...' : 'Download PDF'}
                    </Button>
                  </DialogHeader>
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <div ref={receiptRef} className="bg-white">
                      <BillReceipt order={order} />
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <OrderWhatsApp order={order} />
              {onEdit && (
                <Button size="sm" className="h-9 gap-1.5" onClick={() => onEdit(order.id)}>
                  <Edit2 className="h-4 w-4" />
                  Edit
                </Button>
              )}
            </div>
          </div>
        </div>

        {isClosedStatus ? (
          <div className={cn('flex items-center gap-2 border-t border-border/70 px-4 py-2.5 text-sm sm:px-5', status.tone)}>
            {status.icon}
            <span className="font-medium">This order has been {status.label.toLowerCase()}.</span>
          </div>
        ) : (
          <ol className="grid grid-cols-4 border-t border-border/70 bg-muted/30">
            {TIMELINE.map((step, idx) => {
              const done = idx < stepIndex;
              const active = idx === stepIndex;
              return (
                <li key={step.key} className="relative px-2 py-3 text-center sm:px-4">
                  <span className={cn('absolute inset-x-0 top-0 h-0.5', done || active ? 'bg-primary' : 'bg-transparent')} aria-hidden />
                  <span className={cn('inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide', active ? 'text-primary' : done ? 'text-foreground' : 'text-muted-foreground/70')} aria-current={active ? 'step' : undefined}>
                    <span className={cn('flex h-5 w-5 items-center justify-center rounded-full', done ? 'bg-primary text-primary-foreground' : active ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground')}>
                      {done ? <Check className="h-3 w-3" strokeWidth={3} /> : step.icon}
                    </span>
                    <span className="hidden sm:inline">{step.label}</span>
                  </span>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 sm:gap-5">
        <section className={cn(SURFACE, 'min-w-0 lg:col-span-2')}>
          <div className="flex items-center justify-between gap-3 border-b border-border/70 px-4 py-3 sm:px-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <ShoppingBag className="h-4 w-4 text-primary" />
              Items
            </h2>
            <span className="text-[11px] text-muted-foreground">{totalQuantity} units</span>
          </div>

          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center text-sm text-muted-foreground">
              <ShoppingBag className="h-8 w-8 text-muted-foreground/40" />
              No items are recorded on this order.
            </div>
          ) : (
            <ul className="divide-y divide-border/70">
              {items.map((item) => {
                const image = item.variant?.images?.[0] ?? item.product?.images?.[0];
                const name = item.product?.name ?? `Product #${item.productId}`;
                const variantLabel = item.variant?.name && item.variant.name !== name ? item.variant.name.replace(`${name} - `, '') : null;
                return (
                  <li key={item.id} className="flex items-center gap-3 px-4 py-3 sm:gap-4 sm:px-5">
                    <Link href={`/admin/products/${item.productId}`} className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted/40">
                      {image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={image} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Package className="h-5 w-5 text-muted-foreground/40" />
                      )}
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link href={`/admin/products/${item.productId}`} className="line-clamp-1 text-sm font-semibold hover:underline" title={name}>
                        {name}
                      </Link>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                        {variantLabel && <span className="rounded bg-muted px-1.5 py-0.5 font-medium text-foreground/80">{variantLabel}</span>}
                        {item.variant?.sku && <span className="font-mono">{item.variant.sku}</span>}
                        <span className="tabular-nums">
                          {item.quantity} × {formatPrice(item.unitPrice)}
                        </span>
                      </p>
                      {isOwnOrder && (
                        <div className="mt-1.5">
                          <OrderItemReviewCell orderId={order.id} productId={item.productId} productName={name} reviews={myReviews} />
                        </div>
                      )}
                    </div>
                    <p className="shrink-0 text-sm font-bold tabular-nums">{formatPrice(item.totalPrice ?? item.unitPrice * item.quantity)}</p>
                  </li>
                );
              })}
            </ul>
          )}

          <dl className="space-y-1.5 border-t border-border/70 bg-muted/30 px-4 py-4 text-sm sm:px-5">
            <Line label="Subtotal" value={formatPrice(order.totalAmount)} />
            {order.discount > 0 && <Line label="Discount" value={`−${formatPrice(order.discount)}`} className="text-emerald-700 dark:text-emerald-400" />}
            {order.tax > 0 && <Line label="Tax" value={formatPrice(order.tax)} />}
            <Line label="Shipping & platform fee" value={order.shippingCost > 0 ? formatPrice(order.shippingCost) : 'Free'} className={cn(order.shippingCost === 0 && '[&>dd]:text-emerald-600 dark:[&>dd]:text-emerald-400')} />
            <div className="flex items-baseline justify-between border-t border-border/70 pt-2.5">
              <dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Grand total</dt>
              <dd className="text-xl font-bold tabular-nums text-primary">{formatPrice(order.grandTotal)}</dd>
            </div>
          </dl>
        </section>

        <aside className="min-w-0 space-y-4 sm:space-y-5">
          <section className={cn(SURFACE, 'p-4 sm:p-5')}>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <User className="h-4 w-4 text-primary" />
              Customer
            </h2>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold uppercase text-primary">{customerName.slice(0, 2)}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{customerName}</p>
                <CopyInline label="Customer ID" value={order.customerId} copied={copiedId === 'cust'} onCopy={() => copyToClipboard(order.customerId, 'cust')} />
              </div>
            </div>
            {contact.length > 0 && (
              <ul className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                {order.customer?.email && (
                  <li className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    <a href={`mailto:${order.customer.email}`} className="truncate hover:text-foreground hover:underline">
                      {order.customer.email}
                    </a>
                  </li>
                )}
                {order.customer?.phone && (
                  <li className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 shrink-0" />
                    <a href={`tel:${order.customer.phone}`} className="truncate hover:text-foreground hover:underline">
                      {order.customer.phone}
                    </a>
                  </li>
                )}
              </ul>
            )}
          </section>

          <section className={cn(SURFACE, 'p-4 sm:p-5')}>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Store className="h-4 w-4 text-primary" />
              Store
            </h2>
            <p className="truncate text-sm font-semibold">{storeName}</p>
            <CopyInline label="Store code" value={order.storeCode} copied={copiedId === 'store'} onCopy={() => copyToClipboard(order.storeCode, 'store')} />
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

      <div className={cn(SURFACE, 'overflow-hidden')}>
        <div className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="hidden h-14 w-14 rounded-xl sm:block" />
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-7 w-48" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <Skeleton className="h-4 w-56" />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-7 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-16" />
              <Skeleton className="h-9 w-24" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-4 border-t border-border/70 bg-muted/30 px-4 py-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex justify-center">
              <Skeleton className="h-5 w-20" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 sm:gap-5">
        <div className={cn(SURFACE, 'lg:col-span-2')}>
          <div className="flex items-center justify-between border-b border-border/70 px-4 py-3 sm:px-5">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-3 w-14" />
          </div>
          <div className="divide-y divide-border/70">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3 sm:px-5">
                <Skeleton className="h-14 w-14 shrink-0 rounded-lg" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
          <div className="space-y-2.5 border-t border-border/70 bg-muted/30 px-4 py-4 sm:px-5">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-3.5 w-16" />
              </div>
            ))}
            <div className="flex items-end justify-between border-t border-border/70 pt-2.5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-6 w-28" />
            </div>
          </div>
        </div>

        <div className="space-y-4 sm:space-y-5">
          <div className={cn(SURFACE, 'space-y-3 p-4 sm:p-5')}>
            <Skeleton className="h-4 w-20" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
            <Skeleton className="h-3 w-3/4" />
          </div>
          <div className={cn(SURFACE, 'space-y-2 p-4 sm:p-5')}>
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      </div>
    </div>
  );
}
