'use client';
import { PageHeader } from '@/components/common/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { useGetPurchaseById } from '@/hooks/service-hooks/usePurchaseService';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { ArrowLeft, BadgeAlert, ExternalLink, Package, TriangleAlert, Truck } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatPurchaseAmount, purchaseStatusVariant } from './format';

interface PurchaseDetailsViewProps {
  id: number;
}

const HISTORY_URL = '/admin/stock-purchase/history';

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1">
    <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
    <div className="text-sm break-words">{children}</div>
  </div>
);

const TotalRow = ({ label, value, muted = true }: { label: string; value: React.ReactNode; muted?: boolean }) => (
  <div className="flex items-center justify-between gap-8 text-sm">
    <span className={muted ? 'text-muted-foreground' : 'font-medium'}>{label}</span>
    <span className="font-mono font-semibold">{value}</span>
  </div>
);

export default function PurchaseDetailsView({ id }: PurchaseDetailsViewProps) {
  const router = useRouter();
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const { data: response, isLoading, isError } = useGetPurchaseById(id);
  const purchase = response?.data?.data;

  const formatDate = (value?: string | null) => (value ? unitOfService.DateTimeService.convertToLocalDate(value as unknown as Date, true) : '—');

  if (isLoading) {
    return (
      <div className="flex min-h-[450px] flex-col items-center justify-center space-y-4 p-12">
        <div className="relative flex items-center justify-center">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
          <Truck className="absolute h-6 w-6 animate-pulse text-primary" />
        </div>
        <div className="space-y-1 text-center">
          <p className="text-sm font-semibold text-foreground">Loading purchase details</p>
          <p className="text-xs text-muted-foreground">Retrieving stock receipt record...</p>
        </div>
      </div>
    );
  }

  if (isError || !purchase) {
    return (
      <Card className="mx-auto max-w-2xl rounded-2xl border-destructive/20 bg-destructive/5 p-8 text-center shadow-lg">
        <div className="mx-auto mb-5 w-fit rounded-full bg-destructive/10 p-4 text-destructive">
          <BadgeAlert className="h-10 w-10" />
        </div>
        <h3 className="text-xl font-bold tracking-tight text-destructive">Failed to Load Purchase</h3>
        <p className="mx-auto mb-6 mt-2 max-w-md text-sm text-muted-foreground">
          This purchase may have been removed, or it belongs to a different store than the one you are signed in to.
        </p>
        <Button variant="outline" className="shadow-sm" onClick={() => router.push(HISTORY_URL)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Purchase History
        </Button>
      </Card>
    );
  }

  const items = purchase.items ?? [];
  const totalQuantity = items.reduce((sum, item) => sum + (item.quantity ?? 0), 0);
  const itemsTotal = items.reduce((sum, item) => sum + (item.totalPrice ?? 0), 0);

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <PageHeader
        title="Purchase details"
        description={purchase.invoiceNumber ? `Invoice ${purchase.invoiceNumber}` : `Purchase #${purchase.id}`}
        variant="back"
      />

      <Card className="">
        {/* Document masthead */}
        <div className="flex flex-col gap-4 border-b bg-muted/20 px-6 py-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Truck className="h-5 w-5" />
            </span>
            <div className="space-y-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Purchase Invoice</p>
              <p className="font-mono text-2xl font-bold tracking-tight text-foreground">{purchase.invoiceNumber || `Purchase #${purchase.id}`}</p>
            </div>
          </div>
          <div className="space-y-1.5 sm:text-right">
            <div className="flex items-center gap-2 sm:justify-end">
              {purchase.invoiceNumber && <span className="font-mono text-sm font-semibold text-primary">#{purchase.id}</span>}
              <Badge variant={purchaseStatusVariant(purchase.status)}>{purchase.status || '—'}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              <strong className="font-medium text-foreground">{formatDate(purchase.purchaseDate)}</strong>
            </p>
          </div>
        </div>

        {/* Parties */}
        <div className="grid gap-6 border-b px-6 py-5 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Supplier">
            <div className="flex flex-col">
              <span className="font-medium">{purchase.supplierName || '—'}</span>
              {/* {purchase.supplierId && <span className="text-xs text-muted-foreground">ID: {purchase.supplierId}</span>} */}
            </div>
          </Field>
          <Field label="Received By">
            {purchase.user ? (
              <div className="flex flex-col">
                <span className="font-medium">{purchase.user.name}</span>
                <span className="text-xs text-muted-foreground">{purchase.user.email}</span>
              </div>
            ) : (
              'System'
            )}
          </Field>
          <Field label="Store">
            <code className="font-mono text-xs font-medium uppercase">{purchase.storeCode}</code>
          </Field>
          <Field label="Recorded">{formatDate(purchase.createdAt)}</Field>
          {purchase.updatedAt && formatDate(purchase.updatedAt) !== formatDate(purchase.createdAt) && (
            <Field label="Last updated">{formatDate(purchase.updatedAt)}</Field>
          )}
          <Field label="Invoice File">
            {purchase.invoiceUrl ? (
              <a
                href={purchase.invoiceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md border border-primary/20 bg-primary/5 px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View invoice
              </a>
            ) : (
              '—'
            )}
          </Field>
        </div>

        {/* Line items */}
        <div className="w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/10 hover:bg-muted/10">
                <TableHead className="w-10 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">#</TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Product</TableHead>
                <TableHead className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">Qty</TableHead>
                <TableHead className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">Cost Price</TableHead>
                <TableHead className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center font-medium text-muted-foreground" >
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Package className="h-8 w-8 text-muted-foreground/40" />
                      <span>No items recorded for this purchase.</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item, index) => (
                  <TableRow key={item.id} className="transition-colors hover:bg-muted/5">
                    <TableCell className="px-4 py-4 font-mono text-xs text-muted-foreground">{index + 1}</TableCell>
                    <TableCell className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted/40">
                          {item.product?.images?.[0] ? (
                            // Product images come from arbitrary CDNs; next/image would need each host allow-listed.
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.product.images[0]} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <Package className="h-4 w-4 text-muted-foreground/50" />
                          )}
                        </span>
                        <div className="min-w-0">
                          <Link href={`/admin/products/${item.productId}`} className="font-medium hover:text-primary hover:underline">
                            {item.product?.name || `Product #${item.productId}`}
                          </Link>
                          {item.product?.slug && <p className="truncate font-mono text-xs text-muted-foreground">/{item.product.slug}</p>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-4 text-center">
                      <span className="inline-flex min-w-8 items-center justify-center rounded-md bg-muted/60 px-2.5 py-1 text-xs font-semibold">
                        {item.quantity}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-4 text-right font-mono">{formatPurchaseAmount(item.costPrice)}</TableCell>
                    <TableCell className="px-6 py-4 text-right font-mono font-bold">{formatPurchaseAmount(item.totalPrice)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Totals */}
        <div className="flex justify-end border-t bg-muted/20 px-6 py-5">
          <div className="w-full space-y-2 sm:max-w-xs">
            <TotalRow label="Items" value={items.length} />
            <TotalRow label="Total Quantity" value={totalQuantity} />
            <TotalRow label="Subtotal" value={formatPurchaseAmount(itemsTotal)} />
            <div className="flex items-baseline justify-between gap-8 border-t pt-3">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total</span>
              <span className="font-mono text-2xl font-bold tracking-tight text-primary">{formatPurchaseAmount(purchase.totalAmount)}</span>
            </div>
            {itemsTotal !== purchase.totalAmount && (
              <p className="flex items-center justify-end gap-1 text-right text-[11px] font-medium text-amber-700 dark:text-amber-400">
                <TriangleAlert className="h-3 w-3" />
                Recorded total differs from the sum of items ({formatPurchaseAmount(itemsTotal)})
              </p>
            )}
          </div>
        </div>

        {/* Notes */}
        {purchase.notes && (
          <div className="border-t px-6 py-5">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Notes</span>
            <p className="whitespace-pre-wrap text-sm italic leading-relaxed text-foreground/80">{purchase.notes}</p>
          </div>
        )}

      </Card>
    </div>
  );
}
