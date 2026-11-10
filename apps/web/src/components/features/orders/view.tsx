'use client';

import {
  DETAIL_SURFACE as SURFACE,
  DetailDocumentHeader,
  DetailStatusPanel,
  FactRow as Fact,
  SummaryLine as Line,
  type DetailTimelineStep,
  DetailParty,
  DetailLineItems,
  DetailTotalRow,
  DetailTotalsFooter,
  DetailSectionHeader,
} from '@/components/common/detail-document';
import DetailDocumentSkeleton from '@/components/skelton/detailDocument-Skeleton';
import CreateReturnDialog from '@/components/features/order-returns/create-return';
import OrderItemReviewCell from '@/components/features/reviews/order-item-review-cell';
import OrderStatusMenu from '@/components/features/orders/status-menu';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';

import { useGetOrder, useShareOrder } from '@/hooks/service-hooks/useOrderService';
import { useFetchMyStore } from '@/hooks/service-hooks/useStoreService';
import { useGetAllReviews } from '@/hooks/service-hooks/useReviewService';

import useGetCurrentUser from '@/hooks/useGetCurrentUser';
import { formatPrice } from '@/lib/format-price';
import { cn } from '@/lib/utils';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import {
  AlertTriangle,
  ArrowLeft,
  BadgeAlert,
  CheckCircle2,
  ClipboardList,
  Download,
  FileText,
  Link as LinkIcon,
  HelpCircle,
  Package,
  Receipt,
  Store,
  Truck,
  Undo2,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { ReactNode, useState } from 'react';
import { amountInWords } from '@/lib/amount-in-words';
import { downloadInvoicePdf } from './invoice-pdf';
import { orderToTaxInvoice } from './order-invoice';
import { downloadTemplateBill } from './template-bill';
import { OrderItemDto, Roles } from '@pms/types';
import ListPageHeader from '@/components/common/list-page-header';

interface OrderDetailsViewProps {
  /** The database id (old links) or the order number. */
  idOrNumber: string;
}

const STATUS: Record<string, { label: string; tone: string; dot: string; icon: ReactNode }> = {
  PENDING: {
    label: 'Pending',
    tone: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
    dot: 'bg-amber-500',
    icon: <HelpCircle className="h-4 w-4" />,
  },
  CONFIRMED: { label: 'Confirmed', tone: 'bg-sky-500/10 text-sky-700 dark:text-sky-400', dot: 'bg-sky-500', icon: <Package className="h-4 w-4" /> },
  SHIPPED: {
    label: 'Shipped',
    tone: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400',
    dot: 'bg-indigo-500',
    icon: <Truck className="h-4 w-4" />,
  },
  DELIVERED: {
    label: 'Delivered',
    tone: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    dot: 'bg-emerald-500',
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
  CANCELLED: {
    label: 'Cancelled',
    tone: 'bg-rose-500/10 text-rose-700 dark:text-rose-400',
    dot: 'bg-rose-500',
    icon: <AlertTriangle className="h-4 w-4" />,
  },
  RETURNED: {
    label: 'Returned',
    tone: 'bg-orange-500/10 text-orange-700 dark:text-orange-400',
    dot: 'bg-orange-500',
    icon: <ArrowLeft className="h-4 w-4" />,
  },
};

const TIMELINE: DetailTimelineStep[] = [
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
export default function OrderDetailsView({ idOrNumber }: OrderDetailsViewProps) {
  const router = useRouter();
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const fetchMyStore = useFetchMyStore();
  const { data: response, isLoading, isError } = useGetOrder(idOrNumber);
  const order = response?.data?.data;

  // Rating is only offered to the buyer looking at their own order - the API rejects a
  // review for anyone else's order, so showing the control to staff would just 403.
  const { currentUser } = useGetCurrentUser();
  const isOwnOrder = !!order?.customerId && !!currentUser?.usersId && order.customerId === currentUser.usersId;
  // Moving an order through its stages is an operator action; customers only watch it move.
  const canChangeStatus = currentUser?.role === Roles.ADMIN || currentUser?.role === Roles.SUPER_ADMIN;
  const { data: reviewsResponse } = useGetAllReviews({ orderId: order?.id ?? 0 }, isOwnOrder && !!order?.id);
  const myReviews = reviewsResponse?.data?.data?.data ?? [];

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const shareMutation = useShareOrder();
  const [showReturnDialog, setShowReturnDialog] = useState(false);

  // Returns are raised at the counter by staff or admins, and only against a delivered order -
  // the same rule the API enforces, so the button never leads to a guaranteed 400.
  const canCreateReturn =
    (currentUser?.role === Roles.ADMIN || currentUser?.role === Roles.SUPER_ADMIN || currentUser?.role === Roles.STAFF) &&
    order?.status?.toUpperCase() === 'DELIVERED';

  const generatePdf = async () => {
    if (!order) return;
    try {
      setIsGeneratingPdf(true);
      // Yield once so the button can paint its loading state before the draw begins.
      await new Promise((resolve) => setTimeout(resolve, 0));
      // Fetched here rather than on mount so merely viewing an order costs no extra request;
      // a failure just means the invoice falls back to the bundled logo.
      const logoUrl = await fetchMyStore()
        .then((response) => response.data.data?.storeLogo || undefined)
        .catch(() => undefined);
      // The GST-compliant Tax Invoice layout (GSTINs, HSN, the CGST/SGST split) is the bill a
      // customer receives; the old drawn jsPDF layout stays only as the fallback.
      try {
        await downloadTemplateBill(orderToTaxInvoice(order), logoUrl, `${order.orderNumber}.pdf`);
      } catch {
        await downloadInvoicePdf(order, logoUrl);
      }
    } catch (error) {
      console.error('Failed to generate PDF', error);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // The link is the credential, so it is only ever put somewhere the user chose - the
  // clipboard - never rendered into the page.
  const handleCopyLink = async () => {
    if (!order) return;
    const result = await shareMutation.mutateAsync(order.id);
    const url = result?.data?.data?.url;
    if (result && result.status === 200 && url) {
      try {
        await navigator.clipboard.writeText(url);
        toast({ variant: 'success', title: 'Public link copied', description: <span className="break-all text-xs">{url}</span> });
      } catch {
        toast({ title: 'Public link ready', description: <span className="break-all text-xs">{url}</span> });
      }
    } else {
      const error = unitOfService.ErrorHandlerService.getErrorMessage(result);
      toast({ variant: 'destructive', title: 'Error', description: <span>{error}</span> });
    }
  };

  if (isLoading) return <DetailDocumentSkeleton />;

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
  const status = STATUS[statusKey] ?? {
    label: order.status,
    tone: 'bg-muted text-muted-foreground',
    dot: 'bg-muted-foreground',
    icon: <HelpCircle className="h-4 w-4" />,
  };
  const isClosedStatus = statusKey === 'CANCELLED' || statusKey === 'RETURNED';
  const datePlaced = order.createdAt ? unitOfService.DateTimeService.convertToLocalDate(order.createdAt, true) : '—';

  const items = (order.items ?? []) as OrderItemDto[];
  const totalQuantity = items.reduce((n, item) => n + (item.quantity ?? 0), 0);
  const customerName = order.customer?.name || [order.customer?.firstName, order.customer?.lastName].filter(Boolean).join(' ') || 'Walk-in customer';
  const storeName = order.store?.name?.split(' - ')[0] || 'Store';

  return (
    <div className="space-y-4 animate-in fade-in duration-300 sm:space-y-5">
      <Link href="/admin/orders" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" />
        All orders
      </Link>

      <ListPageHeader
        icon={Receipt}
        title={`Invoice: ${order.orderNumber}`}
        description={`${datePlaced}${order.createdByName ? ` · billed by ${order.createdByName}` : ''}`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 gap-1.5 bg-background/60" onClick={generatePdf} disabled={isGeneratingPdf}>
              <Download className={cn('h-3.5 w-3.5', isGeneratingPdf && 'animate-bounce')} />
              {isGeneratingPdf ? 'Generating…' : 'PDF'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 bg-background/60"
              loading={shareMutation.isPending}
              disabled={shareMutation.isPending}
              onClick={handleCopyLink}
            >
              <LinkIcon className="h-3.5 w-3.5" />
              Copy link
            </Button>
            {canCreateReturn && (
              <Button variant="outline" size="sm" className="h-8 gap-1.5 bg-background/60" onClick={() => setShowReturnDialog(true)}>
                <Undo2 className="h-3.5 w-3.5" />
                Return / Exchange
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 sm:gap-5">
        <section className={cn(SURFACE, 'min-w-0 overflow-hidden lg:col-span-2')}>
          <DetailDocumentHeader
            variant="brand"
            icon={<Receipt />}
            kicker="Invoice"
            title={order.orderNumber}
            meta={`${datePlaced}${order.createdByName ? ` · billed by ${order.createdByName}` : ''}`}
            amountLabel="Amount payable"
            amount={formatPrice(order.grandTotal)}
            badge={canChangeStatus && <OrderStatusMenu order={order} />}
            amountMeta={`${items.length} ${items.length === 1 ? 'product' : 'products'} · ${totalQuantity} qty`}
            // actions={
            //   <>
            //     <Dialog>
            //       <DialogTrigger asChild>
            //         <Button variant="outline" size="sm" className="h-8 gap-1.5 bg-background/60">
            //           <FileText className="h-3.5 w-3.5" />
            //           Bill
            //         </Button>
            //       </DialogTrigger>
            //       <DialogContent className="flex max-h-[92vh] max-w-[900px] flex-col gap-0 p-0" onInteractOutside={(e) => e.preventDefault()}>
            //         <DialogHeader className="flex flex-row items-center justify-between space-y-0 border-b px-5 py-3.5 pr-14 text-left">
            //           <div className="min-w-0">
            //             <DialogTitle className="text-base">Invoice {order.orderNumber}</DialogTitle>
            //             <p className="text-xs text-muted-foreground">A4 preview of what downloads.</p>
            //           </div>
            //           <Button size="sm" className="h-9 gap-1.5" onClick={generatePdf} disabled={isGeneratingPdf}>
            //             <Download className={cn('h-4 w-4', isGeneratingPdf && 'animate-bounce')} />
            //             {isGeneratingPdf ? 'Generating…' : 'Download PDF'}
            //           </Button>
            //         </DialogHeader>

            //         <div className="min-h-0 flex-1 overflow-y-auto bg-muted/40 p-5">
            //           <div className="mx-auto w-[794px] origin-top scale-[0.95] shadow-lg">
            //             <BillReceipt order={order} />
            //           </div>
            //         </div>
            //       </DialogContent>
            //     </Dialog>

            //     <OrderWhatsApp order={order} />
            //   </>
            // }
          />

          {/* {showReturnDialog && <CreateReturnDialog order={order} isOpen={showReturnDialog} onClose={() => setShowReturnDialog(false)} />} */}

          <div className="grid grid-cols-1 gap-px border-t border-border/70 bg-border/70 sm:grid-cols-2">
            <DetailParty
              label="From"
              name={storeName}
              email={order.store?.email}
              phone={order.store?.phone}
              icon={<Store className="h-4 w-4" />}
              className="bg-card px-4 py-4 sm:px-5"
            >
              {order.store?.address && <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{order.store.address}</p>}
            </DetailParty>

            <DetailParty
              label="Bill to"
              name={customerName}
              email={order.customer?.email}
              phone={order.customer?.phone}
              className="bg-card px-4 py-4 sm:px-5"
            ></DetailParty>

            {/* {order.deliveredAt && (
              <div className="grid grid-cols-1 divide-y divide-border/70 border-t border-border/70 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                <DetailAddress label="Billing address" address={order.deliveredAt} className="px-4 py-3.5 sm:px-5" />
                <DetailAddress label="Shipping address" address={estimate.shippingAddress} className="px-4 py-3.5 sm:px-5" />
              </div>
            )} */}
          </div>

          {/* Line items, as an invoice table rather than a stack of rows. */}
          <div className="border-t border-border/70">
            <DetailLineItems
              emptyMessage="No items are recorded on this order."
              showDiscount={false}
              showTax={items.some((item) => (item.taxAmount ?? 0) > 0)}
              items={items.map((item) => {
                const name = item.product?.name ?? `Product #${item.productId}`;
                return {
                  id: item.id,
                  name,
                  href: `/admin/products/${item.productId}`,
                  imageUrl: item.variant?.images?.[0] ?? item.product?.images?.[0] ?? null,
                  variantLabel: item.variant?.name && item.variant.name !== name ? item.variant.name.replace(`${name} - `, '') : null,
                  sku: item.variant?.sku ?? null,
                  quantity: item.quantity,
                  unitPrice: item.unitPrice,
                  taxAmount: item.taxAmount ?? null,
                  // Tax names here are already written as "GST@18%", so appending the rate
                  // again would read "GST@18% @ 18%".
                  taxLabel: item.taxRate ? (item.taxName?.includes('%') ? item.taxName : `${item.taxName ?? 'GST'} @ ${item.taxRate}%`) : null,
                  total: item.totalPrice ?? item.unitPrice * item.quantity,
                  extra: isOwnOrder ? (
                    <div className="mt-1.5">
                      <OrderItemReviewCell orderId={order.id} productId={item.productId} productName={name} reviews={myReviews} />
                    </div>
                  ) : null,
                };
              })}
            />
          </div>

          {/* Words on the left, what is owed on the right - the closing block of a bill. */}
          <DetailTotalsFooter words={amountInWords(order.grandTotal ?? 0)}>
            <Line label="Subtotal" value={formatPrice(order.totalAmount)} />
            <Line
              label="Discount"
              value={order.discount > 0 ? `−${formatPrice(order.discount)}` : '—'}
              className={cn(order.discount > 0 && 'text-emerald-700 dark:text-emerald-400')}
            />
            {order.tax > 0 && (
              <>
                <Line label="Taxable value" value={formatPrice(order.taxableAmount ?? order.totalAmount - order.tax)} className="text-muted-foreground" />
                {order.igstAmount && order.igstAmount > 0 ? (
                  <Line label="IGST" value={formatPrice(order.igstAmount)} className="text-muted-foreground" />
                ) : (
                  <>
                    <Line label="CGST" value={formatPrice(order.cgstAmount ?? order.tax / 2)} className="text-muted-foreground" />
                    <Line label="SGST" value={formatPrice(order.sgstAmount ?? order.tax / 2)} className="text-muted-foreground" />
                  </>
                )}
                <Line label="GST (already inside the price)" value={formatPrice(order.tax)} className="text-muted-foreground" />
              </>
            )}
            {order.tax === 0 && <Line label="GST" value="—" className="text-muted-foreground" />}
            <Line
              label="Shipping & platform fee"
              value={order.shippingCost > 0 ? formatPrice(order.shippingCost) : 'Free'}
              className={cn(order.shippingCost === 0 && '[&>dd]:text-emerald-600 dark:[&>dd]:text-emerald-400')}
            />
            <DetailTotalRow label="Grand Total" value={formatPrice(order.grandTotal)} />
          </DetailTotalsFooter>
        </section>

        {/* Everything about the order rather than on it. */}
        <aside className="min-w-0 space-y-4 sm:space-y-5">
          <DetailStatusPanel
            tone={status.tone}
            icon={status.icon}
            label={status.label}
            hint={isClosedStatus ? `This order was ${status.label.toLowerCase()}.` : 'Current stage of this order'}
            steps={TIMELINE}
            activeKey={statusKey}
            showTimeline={!isClosedStatus}
          />

          <section className={cn(SURFACE, 'p-4 sm:p-5')}>
            <DetailSectionHeader icon={<ClipboardList className="h-4 w-4" />} title="Order details" />
            <dl>
              <Fact label="Products" value={`${items.length} · ${totalQuantity} qty`} />
              <Fact label="Placed" value={datePlaced} />
              <Fact label="Billed by" value={order.createdByName || '—'} />
              <Fact label="Last updated" value={order.updatedAt ? unitOfService.DateTimeService.convertToLocalDate(order.updatedAt, true) : '—'} />
            </dl>
          </section>

          {order.notes && (
            <section className={cn(SURFACE, 'p-4 sm:p-5')}>
              <DetailSectionHeader icon={<FileText />} title="Notes" />
              <dl>
                <Fact label={order.notes} value={''} />
              </dl>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/85"></p>
            </section>
          )}
        </aside>
      </div>

      {showReturnDialog && <CreateReturnDialog order={order} isOpen={showReturnDialog} onClose={() => setShowReturnDialog(false)} />}
    </div>
  );
}
