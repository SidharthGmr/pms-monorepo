'use client';

import ConfirmBox from '@/components/common/confirm-box';
import {
  DETAIL_LABEL as LABEL,
  DETAIL_SURFACE as SURFACE,
  DetailAddress,
  DetailDocumentHeader,
  DetailLineItems,
  DetailParty,
  DetailTotalRow,
  DetailTotalsFooter,
  DetailSectionHeader,
  DetailStatusPanel,
  FactRow as Fact,
  SummaryLine as Line,
  type DetailTimelineStep,
} from '@/components/common/detail-document';
import DetailDocumentSkeleton from '@/components/skelton/detailDocument-Skeleton';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { useDeleteEstimate, useGetEstimateById } from '@/hooks/service-hooks/useEstimateService';
import { amountInWords } from '@/lib/amount-in-words';
import { formatPrice } from '@/lib/format-price';
import { cn } from '@/lib/utils';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { EstimateStatus, EstimateStatusEnum } from '@pms/types';
import { format } from 'date-fns';
import {
  AlertTriangle,
  ArrowLeft,
  BadgeAlert,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileText,
  History as HistoryIcon,
  Pencil,
  Send,
  ShoppingBag,
  Store,
  Trash2,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { ReactNode, useState } from 'react';
import EstimateStatusBadge, { displayStatusOf } from './status-badge';
import ListPageHeader from '@/components/common/list-page-header';

interface EstimateDetailsViewProps {
  id: number;
}

const STATUS: Record<EstimateStatus, { label: string; tone: string; icon: ReactNode; hint: string }> = {
  DRAFT: {
    label: 'Draft',
    tone: 'bg-amber-500/10 text-amber-800 dark:text-amber-300',
    icon: <FileText className="h-4 w-4" />,
    hint: 'Still being prepared — editable until it is sent',
  },
  SENT: {
    label: 'Sent',
    tone: 'bg-sky-500/10 text-sky-700 dark:text-sky-400',
    icon: <Send className="h-4 w-4" />,
    hint: 'Shared with the customer, awaiting their decision',
  },
  ACCEPTED: {
    label: 'Accepted',
    tone: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    icon: <CheckCircle2 className="h-4 w-4" />,
    hint: 'Customer agreed — ready to become an order',
  },
  REJECTED: {
    label: 'Rejected',
    tone: 'bg-rose-500/10 text-rose-700 dark:text-rose-400',
    icon: <XCircle className="h-4 w-4" />,
    hint: 'The customer declined this quotation',
  },
  EXPIRED: {
    label: 'Expired',
    tone: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
    icon: <Clock className="h-4 w-4" />,
    hint: 'The validity date has passed — extend it to continue',
  },
  CONVERTED: {
    label: 'Converted',
    tone: 'bg-violet-500/10 text-violet-700 dark:text-violet-400',
    icon: <ShoppingBag className="h-4 w-4" />,
    hint: 'This quotation became a sales order',
  },
  CANCELLED: {
    label: 'Cancelled',
    tone: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-300',
    icon: <AlertTriangle className="h-4 w-4" />,
    hint: 'Withdrawn by the store',
  },
};

const TIMELINE: DetailTimelineStep[] = [
  { key: 'DRAFT', label: 'Drafted', hint: 'Quotation prepared', icon: <FileText className="h-3.5 w-3.5" /> },
  { key: 'SENT', label: 'Sent', hint: 'Shared with the customer', icon: <Send className="h-3.5 w-3.5" /> },
  { key: 'ACCEPTED', label: 'Accepted', hint: 'Customer agreed to the quote', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  { key: 'CONVERTED', label: 'Converted', hint: 'Turned into a sales order', icon: <ShoppingBag className="h-3.5 w-3.5" /> },
];

/**
 * The estimate read as the document it is: who it is from and to at the top, the quoted lines
 * in the middle, what the offer comes to at the end. Everything about the estimate rather than
 * on it - where it stands, its validity, its history - sits in the column on the right.
 */
export default function EstimateDetailsView({ id }: EstimateDetailsViewProps) {
  const router = useRouter();
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const { data: response, isLoading, isError } = useGetEstimateById(id);
  const deleteMutation = useDeleteEstimate();
  const [showDelete, setShowDelete] = useState(false);

  const estimate = response?.data?.data;

  if (isLoading) return <DetailDocumentSkeleton />;

  if (isError || !estimate) {
    return (
      <div className={cn(SURFACE, 'mx-auto max-w-xl px-6 py-12 text-center')}>
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <BadgeAlert className="h-7 w-7" />
        </div>
        <h3 className="text-lg font-bold tracking-tight">Could not load this estimate</h3>
        <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">It may have been deleted, or it may belong to another store.</p>
        <Button variant="outline" className="mt-5" onClick={() => router.push('/admin/estimates')}>
          <ArrowLeft className="h-4 w-4" />
          Back to estimates
        </Button>
      </div>
    );
  }

  const statusKey = displayStatusOf(estimate);
  const status = STATUS[statusKey];
  const isClosedStatus = statusKey === 'REJECTED' || statusKey === 'EXPIRED' || statusKey === 'CANCELLED';
  const editable = estimate.status === EstimateStatusEnum.Draft;
  const deletable = estimate.status === EstimateStatusEnum.Draft || estimate.status === EstimateStatusEnum.Cancelled;

  const items = estimate.items ?? [];
  const history = estimate.statusHistory ?? [];
  const totalQuantity = items.reduce((n, item) => n + (item.quantity ?? 0), 0);
  const storeName = estimate.store?.siteName || estimate.store?.name?.split(' - ')[0] || 'Store';
  const estimateDate = format(new Date(estimate.estimateDate), 'd MMM yyyy');
  const validUntil = estimate.validUntil ? new Date(estimate.validUntil) : null;
  const validityLapsed = !!validUntil && validUntil.getTime() < Date.now();

  const handleDelete = async () => {
    const result = await deleteMutation.mutateAsync(id);
    if (result && result.status === 200) {
      toast({ variant: 'success', title: 'Estimate deleted successfully' });
      router.push('/admin/estimates');
    } else {
      const error = unitOfService.ErrorHandlerService.getErrorMessage(result);
      toast({ variant: 'destructive', title: 'Error', description: <span>{error}</span> });
      setShowDelete(false);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300 sm:space-y-5">
      <ListPageHeader
        icon={FileText}
        title="Estimate / Quotation"
        description="All estimates"
        backHref="/admin/estimates"
        actions={
          <div className="flex items-center gap-2">
            {editable && (
              <Button asChild variant="outline" size="icon" title="Edit draft" aria-label="Edit draft">
                <Link href={`/admin/estimates/${estimate.id}/edit`}>
                  <Pencil className="h-4 w-4" />
                </Link>
              </Button>
            )}
            {deletable && (
              <Button
                variant="outline"
                size="icon"
                title="Delete"
                aria-label="Delete"
                className="border-destructive/40 text-destructive hover:bg-destructive/5 hover:text-destructive"
                onClick={() => setShowDelete(true)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 sm:gap-5">
        <div className="min-w-0 space-y-4 sm:space-y-5 lg:col-span-2">
          <DetailDocumentHeader
            variant="brand"
            icon={<FileText />}
            kicker="Estimate"
            title={estimate.estimateNumber}
            meta={`${estimateDate}${estimate.createdByName ? ` · Prepared by ${estimate.createdByName}` : ''}${
              estimate.referenceNumber ? ` · Ref ${estimate.referenceNumber}` : ''
            }`}
            amountLabel="Quoted Amount"
            amount={formatPrice(estimate.grandTotal)}
            amountMeta={`${items.length} ${items.length === 1 ? 'product' : 'products'} · ${totalQuantity} qty`}
            badge={<EstimateStatusBadge status={statusKey} className="bg-background shadow-md ring-0" />}
            extra={
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset',
                  validityLapsed ? 'bg-amber-400/20 text-amber-100 ring-amber-300/40' : 'bg-white/10 text-primary-foreground/90 ring-white/25'
                )}
              >
                <CalendarClock className="h-3.5 w-3.5" />
                {validUntil ? `${validityLapsed ? 'Validity ended' : 'Valid until'} ${format(validUntil, 'd MMM yyyy')}` : 'No expiry date'}
              </span>
            }
          />

          {/* Who it is from and who it is for, the way a quotation opens. */}
          <section className={cn(SURFACE, 'overflow-hidden')}>
            <div className="grid grid-cols-1 divide-y divide-border/70 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
              <DetailParty
                label="From"
                name={storeName}
                email={estimate.store?.email}
                phone={estimate.store?.phone}
                imageUrl={estimate.store?.storeLogo}
                icon={<Store className="h-4 w-4" />}
                className="px-4 py-4 sm:px-5"
              >
                {estimate.store?.address && <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{estimate.store.address}</p>}
              </DetailParty>

              <DetailParty
                label="Quote for"
                name={estimate.customerName}
                email={estimate.customerEmail}
                phone={estimate.customerPhone}
                className="px-4 py-4 sm:px-5"
              />
            </div>

            {(estimate.billingAddress || estimate.shippingAddress) && (
              <div className="grid grid-cols-1 divide-y divide-border/70 border-t border-border/70 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                <DetailAddress label="Billing address" address={estimate.billingAddress} className="px-4 py-3.5 sm:px-5" />
                <DetailAddress label="Shipping address" address={estimate.shippingAddress} className="px-4 py-3.5 sm:px-5" />
              </div>
            )}
          </section>

          {/* Quoted lines, as a quotation table rather than a stack of rows. */}
          <section className={cn(SURFACE, 'overflow-hidden')}>
            <DetailLineItems
              emptyMessage="No items are recorded on this estimate."
              items={items.map((item) => ({
                id: item.id,
                name: item.productName,
                href: `/admin/products/${item.productId}`,
                variantLabel:
                  item.variantName && item.variantName !== item.productName ? item.variantName.replace(`${item.productName} - `, '') : null,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                discountAmount: item.discountAmount,
                taxAmount: item.taxAmount,
                taxLabel: item.taxAmount > 0 ? `${item.taxName || 'GST'}@${item.taxRate}%` : null,
                total: item.lineTotal,
              }))}
            />

            <DetailTotalsFooter
              words={amountInWords(estimate.grandTotal ?? 0)}
              note="This is a quotation, not a bill — no stock is reserved and no payment is due yet."
            >
              <Line label="Subtotal" value={formatPrice(estimate.subtotal)} />
              {estimate.itemDiscountTotal > 0 && (
                <Line
                  label="Item discounts"
                  value={`−${formatPrice(estimate.itemDiscountTotal)}`}
                  className="text-emerald-700 dark:text-emerald-400"
                />
              )}
              {estimate.additionalDiscount > 0 && (
                <Line
                  label="Additional discount"
                  value={`−${formatPrice(estimate.additionalDiscount)}`}
                  className="text-emerald-700 dark:text-emerald-400"
                />
              )}
              {estimate.taxAmount > 0 && (
                <>
                  <Line label="Taxable amount" value={formatPrice(estimate.taxableAmount)} className="text-muted-foreground" />
                  {estimate.isInterState ? (
                    <Line label="IGST" value={formatPrice(estimate.igstAmount)} className="text-muted-foreground" />
                  ) : (
                    <>
                      <Line label="CGST" value={formatPrice(estimate.cgstAmount)} className="text-muted-foreground" />
                      <Line label="SGST" value={formatPrice(estimate.sgstAmount)} className="text-muted-foreground" />
                    </>
                  )}
                  <Line label="Total tax (incl. in prices unless marked)" value={formatPrice(estimate.taxAmount)} className="text-muted-foreground" />
                </>
              )}
              {estimate.shippingCharges > 0 && <Line label="Shipping" value={formatPrice(estimate.shippingCharges)} />}
              {estimate.adjustment !== 0 && <Line label="Adjustment" value={formatPrice(estimate.adjustment)} />}
              <DetailTotalRow label="Estimate Total" value={formatPrice(estimate.grandTotal)} />
            </DetailTotalsFooter>
          </section>

          {(estimate.notes || estimate.terms) && (
            <section className={cn(SURFACE, 'grid grid-cols-1 gap-4 p-4 sm:p-5 lg:grid-cols-2')}>
              {estimate.notes && (
                <div className="min-w-0">
                  <p className={LABEL}>Notes</p>
                  <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-foreground/85">{estimate.notes}</p>
                </div>
              )}
              {estimate.terms && (
                <div className="min-w-0">
                  <p className={LABEL}>Terms &amp; conditions</p>
                  <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-foreground/85">{estimate.terms}</p>
                </div>
              )}
            </section>
          )}
        </div>

        {/* Everything about the estimate rather than on it. */}
        <aside className="min-w-0 space-y-4 sm:space-y-5">
          <DetailStatusPanel
            title="Estimate Status"
            tone={status.tone}
            icon={status.icon}
            label={status.label}
            hint={status.hint}
            steps={TIMELINE}
            activeKey={statusKey}
            showTimeline={!isClosedStatus}
          />

          {estimate.convertedOrder && (
            <section className={cn(SURFACE, 'p-4 sm:p-5')}>
              <DetailSectionHeader icon={<ShoppingBag className="h-4 w-4" />} title="Converted Order" />
              <Link
                href={`/admin/orders/${estimate.convertedOrder.id}`}
                className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
              >
                {estimate.convertedOrder.orderNumber}
              </Link>
              {estimate.convertedAt && (
                <p className="mt-1 text-[11px] text-muted-foreground">Converted {format(new Date(estimate.convertedAt), 'd MMM yyyy, h:mm a')}</p>
              )}
            </section>
          )}

          <section className={cn(SURFACE, 'p-4 sm:p-5')}>
            <DetailSectionHeader icon={<ClipboardList className="h-4 w-4" />} title="Estimate Details" />
            <dl>
              <Fact label="Products" value={`${items.length}`} />
              <Fact label="Total quantity" value={`${totalQuantity}`} />
              <Fact label="Estimate date" value={estimateDate} />
              <Fact label="Valid until" value={validUntil ? format(validUntil, 'd MMM yyyy') : 'No expiry'} highlight={validityLapsed} />
              <Fact label="Reference" value={estimate.referenceNumber || '—'} />
              <Fact label="Place of supply" value={estimate.isInterState ? 'Inter-state (IGST)' : 'Intra-state (CGST + SGST)'} />
              <Fact label="Prepared by" value={estimate.createdByName || '—'} />
              <Fact label="Last updated" value={estimate.updatedAt ? format(new Date(estimate.updatedAt), 'd MMM yyyy, h:mm a') : '—'} />
            </dl>
          </section>

          {history.length > 0 && (
            <section className={cn(SURFACE, 'p-4 sm:p-5')}>
              <DetailSectionHeader icon={<HistoryIcon className="h-4 w-4" />} title="History" />
              <ol className="space-y-2.5">
                {history.map((entry) => (
                  <li key={entry.id} className="flex items-start gap-2.5 text-xs">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">
                        {entry.fromStatus
                          ? `${STATUS[entry.fromStatus]?.label ?? entry.fromStatus} → ${STATUS[entry.toStatus]?.label ?? entry.toStatus}`
                          : (STATUS[entry.toStatus]?.label ?? entry.toStatus)}
                      </p>
                      <p className="text-muted-foreground">
                        {format(new Date(entry.createdAt), 'd MMM yyyy, h:mm a')}
                        {entry.changedByName ? ` · ${entry.changedByName}` : ''}
                      </p>
                      {entry.note && <p className="text-muted-foreground">{entry.note}</p>}
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </aside>
      </div>

      {showDelete && (
        <ConfirmBox
          isOpen={showDelete}
          onClose={() => setShowDelete(false)}
          onSubmit={handleDelete}
          heading="Delete estimate"
          loading={deleteMutation.isPending}
          bodyText={`Delete ${estimate.estimateNumber}? This cannot be undone.`}
        />
      )}
    </div>
  );
}
