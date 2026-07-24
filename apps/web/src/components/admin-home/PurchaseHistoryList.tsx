'use client';

import { PurchaseDto } from '@/dtos/purchase.dto';
import { useGetAllPurchases } from '@/hooks/service-hooks/usePurchaseService';
import { formatDistanceToNow } from 'date-fns';
import { ArrowRight, Package, ShoppingCart, UserRound } from 'lucide-react';
import Link from 'next/link';
import { DashboardEmptyState } from '../skelton/empty-states';
import ProductsOrdersSkeleton from '../skelton/products-orders';
import { CardDescription } from '../ui/card';

export default function PurchaseHistoryList() {
  const { data: response, isLoading, isError } = useGetAllPurchases({ page: 1, recordPerPage: 5 });

  if (isLoading) return <ProductsOrdersSkeleton />;
  if (isError) return <CardDescription>{response?.data?.message || 'Something went wrong.'}</CardDescription>;

  const purchases: PurchaseDto[] = response?.data?.data?.data || [];

  if (purchases.length === 0) {
    return (
      <DashboardEmptyState
        title="No purchases yet"
        description="Recent purchases will appear here."
        ctaUrl="/admin/purchase"
        ctaTitle="Create Purchase"
        icon={ShoppingCart}
      />
    );
  }

  return (
    <div className="divide-y divide-border/60">
      {purchases.map((purchase) => {
        const itemCount = purchase.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) ?? 0;
        const productNames = (purchase.items || [])
          .map((item) => item.product?.name || `#${item.productId}`)
          .filter(Boolean)
          .join(', ');

        return (
          <Link
            key={purchase.id}
            href={`/admin/purchase/${purchase.id}`}
            className="group flex items-start gap-3 py-3 first:pt-0 last:pb-0"
          >
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <ShoppingCart className="h-4 w-4" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-semibold text-foreground">{purchase.invoiceNumber || `#${purchase.id}`}</span>
                {purchase.supplierName && <span className="truncate text-xs text-muted-foreground">{purchase.supplierName}</span>}
              </div>
              <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                <span>{formatDistanceToNow(new Date(purchase.purchaseDate || purchase.createdAt), { addSuffix: true })}</span>
                <span className="h-1 w-1 shrink-0 rounded-full bg-border" />
                <span>{itemCount} items</span>
              </div>

              <div className="mt-2 flex flex-col gap-1 rounded-lg bg-muted/40 p-2 text-xs">
                <span className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
                  <UserRound className="h-3.5 w-3.5 shrink-0" />
                  By
                  <span className="truncate font-medium text-foreground">{purchase.user?.name || '—'}</span>
                </span>
                <span className="flex items-start gap-1.5 text-muted-foreground">
                  <Package className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span className="line-clamp-1 text-foreground">{productNames || '—'}</span>
                </span>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1 pt-0.5">
              <span className="text-sm font-semibold text-foreground">
                ₹{(purchase.totalAmount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
