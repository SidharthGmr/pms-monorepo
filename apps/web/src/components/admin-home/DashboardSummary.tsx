'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardSummaryDto, ProductDistribution } from '@/dtos/dashboard-summary.dto';
import { useGetDashboardSummary } from '@/hooks/service-hooks/useDashboardService';
import { useGetLowStockProducts } from '@/hooks/service-hooks/useProductService';
import useGetCurrentUser from '@/hooks/useGetCurrentUser';
import { cn } from '@/lib/utils';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Briefcase,
  Folder,
  Package,
  Plus,
  Receipt,
  ShoppingBag,
  ShoppingCart,
  Star,
  Tag,
  Tags,
  UserRound,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import { DashboardEmptyState } from '../skelton/empty-states';
import DashboardOverviewChart from './DashboardOverviewChart';
import DashboardStats from './DashboardStats';
import PurchaseHistoryList from './PurchaseHistoryList';
import RecentOrdersList from './RecentOrdersList';

/* ------------------------------------------------------------------ */
/* Reusable panel                                                      */
/* ------------------------------------------------------------------ */

function Panel({
  title,
  icon: Icon,
  count,
  href,
  ctaLabel,
  children,
  className,
}: {
  title: string;
  icon: React.ElementType;
  count?: number;
  href?: string;
  ctaLabel?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col rounded-2xl border border-border/60 bg-card', className)}>
      <div className="flex items-center justify-between gap-3 border-b border-border/60 px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-foreground/70">
            <Icon className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {count != null && count > 0 && <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{count}</span>}
        </div>
        {href && (
          <Link
            href={href}
            className="group inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {ctaLabel || 'View all'}
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}
      </div>
      <div className="flex-1 p-5">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page header                                                         */
/* ------------------------------------------------------------------ */

function DashboardHeader() {
  const { currentUser } = useGetCurrentUser();
  const name = useMemo(() => currentUser?.name?.trim() || 'there', [currentUser?.name]);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {greeting}, <span className="capitalize">{name}</span>
        </h1>
        <p className="text-sm text-muted-foreground">Here&apos;s what&apos;s happening with your store today.</p>
        {(currentUser?.role || currentUser?.storeCode) && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {currentUser?.role && (
              <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{currentUser.role}</span>
            )}
            {currentUser?.storeCode && <span className="font-mono text-xs text-muted-foreground/80">{currentUser.storeCode}</span>}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="gap-1.5 rounded-full px-2.5 py-1 font-normal">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </span>
          Live
        </Badge>
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/profile">
            <UserRound className="mr-1.5 h-4 w-4" />
            Edit Profile
          </Link>
        </Button>
        <Button size="sm" asChild>
          <Link href="/admin/purchase">
            <Plus className="mr-1.5 h-4 w-4" />
            Create Order
          </Link>
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* List item helpers                                                   */
/* ------------------------------------------------------------------ */

function ListRow({ children, href }: { children: ReactNode; href: string }) {
  return (
    <Link href={href} className="group flex items-center gap-3 py-3 first:pt-0 last:pb-0">
      {children}
      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function DashboardHome() {
  const { data: lowStockData, isLoading: isLowStockLoading } = useGetLowStockProducts();
  const lowStockProducts = lowStockData?.data?.data?.data || [];

  const getDashboardSummaryResponse = useGetDashboardSummary();
  const [data, setData] = useState<DashboardSummaryDto>();

  useEffect(() => {
    if (getDashboardSummaryResponse.isSuccess && getDashboardSummaryResponse.data?.data?.data) {
      setData(getDashboardSummaryResponse.data.data.data);
    }
  }, [getDashboardSummaryResponse.isSuccess, getDashboardSummaryResponse.data?.data?.data]);

  if (getDashboardSummaryResponse.isLoading || isLowStockLoading) {
    return (
      <div className="space-y-6 p-2">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-[132px] w-full rounded-xl" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-12">
          <Skeleton className="h-[380px] w-full rounded-2xl lg:col-span-8" />
          <Skeleton className="h-[380px] w-full rounded-2xl lg:col-span-4" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (getDashboardSummaryResponse.isError) {
    return (
      <div className="p-2">
        <Card className="rounded-2xl border border-border/60 shadow-none">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="rounded-full bg-rose-500/10 p-3">
                <AlertCircle className="h-7 w-7 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">Failed to load dashboard</h3>
                <p className="mt-1 text-sm text-muted-foreground">Something went wrong while loading your data.</p>
              </div>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Try again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-2">
      <DashboardHeader />

      <DashboardStats summaryData={data} />

      {/* Main row: recent orders + right rail */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Panel className="lg:col-span-8" title="Recent Orders" icon={Receipt} href="/admin/orders" ctaLabel="View all orders">
          <RecentOrdersList />
        </Panel>

        <div className="flex flex-col gap-6 lg:col-span-4">
          {/* Low stock */}
          <Panel title="Low Stock" icon={AlertTriangle} count={lowStockProducts.length} href="/admin/products">
            {lowStockProducts.length > 0 ? (
              <div className="flex flex-col gap-4">
                {lowStockProducts.slice(0, 4).map((product: any) => {
                  const threshold = product.lowStockThreshold || 5;
                  const pct = Math.min((product.stock / threshold) * 100, 100);
                  return (
                    <div key={product.id} className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <Link href={`/admin/products/${product.id}`} className="truncate text-sm font-medium text-foreground hover:text-primary">
                          {product.name}
                        </Link>
                        <span
                          className={cn(
                            'shrink-0 text-xs font-semibold',
                            product.stock === 0 ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'
                          )}
                        >
                          {product.stock === 0 ? 'Out' : `${product.stock} / ${threshold}`}
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn('h-full transition-all', product.stock === 0 ? 'bg-rose-500' : 'bg-amber-500')}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10">
                  <Package className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="text-sm font-medium text-foreground">All stocked up</p>
                <p className="text-xs text-muted-foreground">No low-stock items.</p>
              </div>
            )}
          </Panel>

          {/* Top products */}
          <Panel title="Top Products" icon={BarChart3} href="/admin/products">
            {data?.productDistribution && data.productDistribution.length > 0 ? (
              <div className="flex flex-col gap-4">
                {data.productDistribution.slice(0, 5).map((product: ProductDistribution) => (
                  <div key={product.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="truncate text-muted-foreground">{product.name}</span>
                      <span className="shrink-0 pl-2 font-semibold text-foreground">{product.percentage}%</span>
                    </div>
                    <Progress value={product.percentage} className="h-1.5 bg-muted [&>div]:bg-primary" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-sm text-muted-foreground">No sales data yet.</div>
            )}
          </Panel>
        </div>
      </div>

      {/* Recent products + attributes */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Purchase history */}
        <Panel title="Purchase History" icon={ShoppingCart} href="/admin/purchase" ctaLabel="View all purchases">
          <PurchaseHistoryList />
        </Panel>

        {/* Sales vs purchases chart (period toggle) */}
        <DashboardOverviewChart data={data} />

        <Panel title="Recent Products" icon={Package} href="/admin/products">
          {data && data.products?.length > 0 ? (
            <div className="divide-y divide-border/60">
              {data.products.map((product, index) => (
                <ListRow key={product.id} href={`/admin/products/${product.id}`}>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Package className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-foreground">{product.name}</span>
                      {index === 0 && (
                        <Badge className="rounded border-none bg-primary/10 px-1.5 py-0 text-[10px] font-semibold uppercase tracking-wide text-primary">
                          New
                        </Badge>
                      )}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="truncate">SKU: {product.slug}</span>
                      <span className="h-1 w-1 shrink-0 rounded-full bg-border" />
                      <span className="shrink-0">
                        Stock: <strong className="text-foreground">{product.stock}</strong>
                      </span>
                    </div>
                  </div>
                </ListRow>
              ))}
            </div>
          ) : (
            <DashboardEmptyState title="No recent products" ctaUrl="/admin/products/create" ctaTitle="Create Product" icon={ShoppingBag} />
          )}
        </Panel>

        <Panel title="Recent Attributes" icon={Tags} href="/admin/attributes" ctaLabel="View all attributes">
          {data && data.attributes?.length > 0 ? (
            <div className="divide-y divide-border/60">
              {data.attributes.map((attribute) => (
                <ListRow key={attribute.id} href={`/admin/attributes/${attribute.id}`}>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Star className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-foreground">{attribute.name}</span>
                      <Badge
                        className={cn(
                          'rounded border-none px-1.5 py-0 text-[10px] font-semibold uppercase tracking-wide',
                          attribute.status === 'Published'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {attribute.status}
                      </Badge>
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      Unit: <strong className="text-foreground">{attribute.unit || 'N/A'}</strong>
                    </div>
                  </div>
                </ListRow>
              ))}
            </div>
          ) : (
            <DashboardEmptyState title="No recent attributes" ctaUrl="/admin/attributes/create" ctaTitle="Create Attribute" icon={Star} />
          )}
        </Panel>

        <Panel title="Recent Categories" icon={Folder} href="/admin/categories" ctaLabel="View all categories">
          {data && data.categories?.length > 0 ? (
            <div className="divide-y divide-border/60">
              {data.categories.map((category) => (
                <ListRow key={category.id} href={`/admin/categories/${category.id}`}>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Folder className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-foreground">{category.name}</span>
                      <Badge
                        className={cn(
                          'rounded border-none px-1.5 py-0 text-[10px] font-semibold uppercase tracking-wide',
                          category.status === 'Published'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {category.status}
                      </Badge>
                    </div>
                    {category.description && <div className="mt-0.5 truncate text-xs text-muted-foreground">{category.description}</div>}
                  </div>
                </ListRow>
              ))}
            </div>
          ) : (
            <DashboardEmptyState title="No recent categories" ctaUrl="/admin/categories/create" ctaTitle="Create Category" icon={Folder} />
          )}
        </Panel>

        <Panel title="Recent Brands" icon={Tag} href="/admin/brand-names" ctaLabel="View all brands">
          {data && data.brands?.length > 0 ? (
            <div className="divide-y divide-border/60">
              {data.brands.map((brand) => (
                <ListRow key={brand.id} href={`/admin/brand-names/${brand.id}`}>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Tag className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-foreground">{brand.name}</span>
                      <Badge
                        className={cn(
                          'rounded border-none px-1.5 py-0 text-[10px] font-semibold uppercase tracking-wide',
                          brand.status === 'Published'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {brand.status}
                      </Badge>
                    </div>
                  </div>
                </ListRow>
              ))}
            </div>
          ) : (
            <DashboardEmptyState title="No recent brands" ctaUrl="/admin/brand-names/create" ctaTitle="Create Brand" icon={Tag} />
          )}
        </Panel>

        <Panel title="Recent Customers" icon={Users} href="/admin/customer" ctaLabel="View all customers">
          {data && data.customers?.length > 0 ? (
            <div className="divide-y divide-border/60">
              {data.customers.map((customer) => (
                <ListRow key={customer.id} href="/admin/customer">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <UserRound className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-foreground">{customer.name}</span>
                      <Badge
                        className={cn(
                          'rounded border-none px-1.5 py-0 text-[10px] font-semibold uppercase tracking-wide',
                          customer.isActive
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {customer.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="mt-0.5 truncate text-xs text-muted-foreground">{customer.email || customer.phone || '—'}</div>
                  </div>
                </ListRow>
              ))}
            </div>
          ) : (
            <DashboardEmptyState title="No recent customers" ctaUrl="/admin/customer" ctaTitle="Add Customer" icon={Users} />
          )}
        </Panel>

        <Panel title="Recent Staff" icon={Briefcase} href="/admin/staff" ctaLabel="View all staff">
          {data && data.staff?.length > 0 ? (
            <div className="divide-y divide-border/60">
              {data.staff.map((member) => (
                <ListRow key={member.id} href="/admin/staff">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Briefcase className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-foreground">{member.user?.name || '—'}</span>
                      <Badge
                        className={cn(
                          'rounded border-none px-1.5 py-0 text-[10px] font-semibold uppercase tracking-wide',
                          member.isActive
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {member.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="mt-0.5 truncate text-xs text-muted-foreground">
                      {member.position || member.department || member.user?.email || '—'}
                    </div>
                  </div>
                </ListRow>
              ))}
            </div>
          ) : (
            <DashboardEmptyState title="No recent staff" ctaUrl="/admin/staff" ctaTitle="Add Staff" icon={Briefcase} />
          )}
        </Panel>
      </div>
    </div>
  );
}
