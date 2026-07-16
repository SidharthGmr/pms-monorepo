'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardSummaryDto, ProductDistribution } from '@/dtos/dashboard-summary.dto';
import { useGetDashboardSummary } from '@/hooks/service-hooks/useDashboardService';
import { useGetLowStockProducts } from '@/hooks/service-hooks/useProductService';
import useGetCurrentUser from '@/hooks/useGetCurrentUser';
import { AlertCircle, AlertTriangle, ArrowRight, Layers, Package, Receipt, ShoppingBag, Star, Tags } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import SectionCard from '../common/custome-card';
import GreetingHeader from '../common/greeting-header';
import { DashboardEmptyState } from '../skelton/empty-states';
import DashboardStats from './DashboardStats';
import RecentOrdersList from './RecentOrdersList';

const PROGRESS_COLORS = [
  'bg-gradient-to-r from-amber-400 to-amber-500',
  'bg-gradient-to-r from-emerald-400 to-emerald-500',
  'bg-gradient-to-r from-violet-400 to-violet-500',
  'bg-gradient-to-r from-blue-400 to-blue-500',
  'bg-gradient-to-r from-sky-400 to-sky-500',
  'bg-gradient-to-r from-rose-400 to-rose-500',
  'bg-gradient-to-r from-teal-400 to-teal-500',
  'bg-gradient-to-r from-pink-400 to-pink-500',
];

const StatCardSkeleton = () => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-10 w-10 rounded-lg" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-8 w-24 mb-2" />
      <Skeleton className="h-3 w-32" />
    </CardContent>
  </Card>
);

const RecentItemSkeleton = () => (
  <div className="flex items-center justify-between border-b pb-3">
    <div className="space-y-2">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-3 w-24" />
    </div>
    <Skeleton className="h-8 w-16" />
  </div>
);

export default function DashboardHome() {
  //const { data, isLoading, isError, error } = useGetDashboardSummary();
  const { data: lowStockData, isLoading: isLowStockLoading } = useGetLowStockProducts();
  const { currentUser } = useGetCurrentUser();
  //const summaryData = data?.data?.data;
  const lowStockProducts = lowStockData?.data?.data?.data || [];

  const getDashboardSummaryResponse = useGetDashboardSummary();

  const [data, setData] = useState<DashboardSummaryDto>();
  const [recordCount, setRecordCount] = useState<number>(0);
  useEffect(() => {
    if (getDashboardSummaryResponse.isSuccess && getDashboardSummaryResponse.data?.data?.data) {
      setData(getDashboardSummaryResponse.data.data.data);
    }
  }, [getDashboardSummaryResponse.isSuccess, getDashboardSummaryResponse.data?.data?.data]);

  if (getDashboardSummaryResponse.isLoading || isLowStockLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
        <div className="space-y-8 p-4 md:p-8">
          {/* Header Skeleton */}
          <div className="space-y-2">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-4 w-96" />
          </div>

          {/* Stats Grid Skeleton */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>

          {/* Charts and Recent Activity Skeleton */}
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-[400px] w-full rounded-xl" />
            <Skeleton className="h-[400px] w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (getDashboardSummaryResponse.isError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-4 md:p-8">
        <Card className="border-red-200 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30">
                <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-red-800 dark:text-red-300">Failed to Load Dashboard</h3>
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  {/* {getDashboardSummaryResponse.isError ? (getDashboardSummaryResponse.error instanceof Error ? getDashboardSummaryResponse.error.message : 'Please try again later.'} */}
                  Error{' '}
                </p>
              </div>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen ">
      <div className="space-y-6 p-2">
        <GreetingHeader />

        <DashboardStats summaryData={data} />

        <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
          <div className="col-span-4">
            <SectionCard title="Recent Orders" icon={Receipt} href="/admin/orders" ctaTitle="View All Orders">
              <>
                <RecentOrdersList />
              </>
            </SectionCard>
          </div>
          <div className="col-span-2">
            <SectionCard title="Products Stock" icon={Receipt} href="/admin/orders" ctaTitle="View All Orders">
              <>
                {data?.productDistribution && data?.productDistribution.length > 0 ? (
                  <div className="space-y-4 w-full">
                    {data?.productDistribution.map((product: ProductDistribution, index: number) => (
                      <div key={product.name} className="space-y-1.5">
                        <div className="flex justify-between items-center text-sm font-medium">
                          <span className="text-muted-foreground">{product.name}</span>
                          <span className="font-bold text-foreground">
                            {product.stock}/ {product.count} | ({product.percentage}%)
                          </span>
                        </div>
                        <Progress
                          value={product.percentage}
                          color={PROGRESS_COLORS[index % PROGRESS_COLORS.length]}
                          className="h-2 rounded-full bg-slate-100 dark:bg-slate-800"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <DashboardEmptyState title="No recent products" ctaUrl="/admin/products/create" ctaTitle="Create Product" icon={ShoppingBag} />
                )}
              </>
            </SectionCard>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SectionCard
            title={
              <div className="flex items-center gap-2">
                <span>Low Stock Alerts</span>
                {lowStockProducts.length > 0 && (
                  <span className="bg-rose-500 text-white text-[11px] px-2 py-0.5 rounded-full font-bold shadow-sm animate-pulse">
                    {lowStockProducts.length}
                  </span>
                )}
              </div>
            }
            icon={AlertTriangle}
            href="/admin/products"
            ctaTitle="View All Orders"
          >
            {lowStockProducts.length > 0 ? (
              <div className="flex flex-col gap-3">
                {lowStockProducts.map((product: any) => (
                  <div
                    key={product.id}
                    className="group flex flex-col p-3 bg-rose-50/20 dark:bg-rose-950/10 border border-rose-100/80 dark:border-rose-900/30 hover:border-rose-300 dark:hover:border-rose-700/50 transition-all duration-300 rounded-xl relative overflow-hidden"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500" />

                    <div className="flex items-center justify-between gap-2 mb-1.5 pl-1.5">
                      <h4 className="font-bold text-sm text-foreground truncate max-w-[130px]">{product.name}</h4>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Badge
                          variant="destructive"
                          className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 bg-rose-500 text-white rounded-md"
                        >
                          {product.stock === 0 ? 'Out' : `${product.stock} left`}
                        </Badge>
                        <Link href={`/admin/products/${product.id}`}>
                          <Button
                            variant="secondary"
                            size="icon"
                            className="h-6 w-6 rounded-full bg-rose-100 hover:bg-rose-200 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 transition-transform hover:scale-105"
                          >
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground pl-1.5">
                      <span className="truncate">SKU: {product.slug}</span>
                      <span className="font-semibold text-foreground">${product.price?.toFixed(2)}</span>
                    </div>

                    <div className="mt-2 px-1.5 py-1 bg-background/50 dark:bg-card/50 rounded-lg flex items-center justify-between text-[11px]">
                      <span>
                        Stock: <strong className="text-rose-600 dark:text-rose-400 font-bold">{product.stock}</strong> /{' '}
                        {product.lowStockThreshold || 5}
                      </span>
                      <div className="w-16 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-rose-500 h-full transition-all"
                          style={{ width: `${Math.min((product.stock / (product.lowStockThreshold || 5)) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <DashboardEmptyState
                title="Inventory looks great!"
                description="All products are well-stocked."
                ctaUrl="/admin/products"
                ctaTitle="View All Products"
                icon={Package}
              />
            )}
          </SectionCard>

          <SectionCard title="Recent Products" icon={Package} href="/admin/orders" ctaTitle="View All Orders">
            {data && data?.products?.length > 0 ? (
              <div className="flex flex-col gap-3">
                {data?.products.map((product, index) => (
                  <div
                    key={product.id}
                    className="group flex items-center justify-between p-3 bg-background border border-border/40 hover:border-primary/20 hover:shadow-sm transition-all duration-300 rounded-xl"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="h-9 w-9 rounded-lg bg-primary/5 flex items-center justify-center text-primary shrink-0 group-hover:scale-105 transition-transform">
                        <Package className="h-4.5 w-4.5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h4 className="font-semibold text-xs md:text-sm text-foreground truncate">{product.name}</h4>
                          {index === 0 && (
                            <Badge className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 bg-primary/10 text-primary hover:bg-primary/20 border-none shadow-sm rounded">
                              New
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="truncate">SKU: {product.lowStockThreshold}</span>
                          <span className="w-1 h-1 rounded-full bg-border shrink-0" />
                          <span>
                            Stock: <strong className="text-foreground">{product.stock}</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pl-3 border-l border-border/40 shrink-0">
                      {/* <span className="text-xs md:text-sm font-bold text-foreground">
                        ${product.price.toFixed(2)}
                      </span> */}
                      <Link href={`/admin/products/${product.id}`}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200"
                        >
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <DashboardEmptyState title="No recent attributes" ctaUrl="/admin/attributes/create" ctaTitle="Create Attribute" icon={Star} />
            )}
          </SectionCard>

          <SectionCard title="Recent Attributes" icon={Tags} href="/admin/attributes" ctaTitle="View All Attributes">
            {data && data?.attributes?.length > 0 ? (
              <div className="flex flex-col gap-3">
                {data.attributes.map((attribute) => (
                  <div
                    key={attribute.id}
                    className="group flex items-center justify-between p-3 bg-background border border-border/40 hover:border-primary/20 hover:shadow-sm transition-all duration-300 rounded-xl"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="h-9 w-9 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Star className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h4 className="font-semibold text-xs md:text-sm text-foreground truncate">{attribute.name}</h4>
                          <Badge
                            className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 border-none rounded ${
                              attribute.status === 'Published'
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {attribute.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>
                            Unit: <strong className="text-foreground">{attribute.unit || 'N/A'}</strong>
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pl-3 border-l border-border/40 shrink-0">
                      <Link href={`/admin/attributes/${attribute.id}`}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200"
                        >
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <DashboardEmptyState title="No recent attributes" ctaUrl="/admin/attributes/create" ctaTitle="Create Attribute" icon={Star} />
            )}
          </SectionCard>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <Card className="group relative overflow-hidden bg-card border border-border/50 hover:border-blue-500/20 shadow-sm transition-all duration-300 rounded-xl p-4 flex flex-col justify-between">
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-300">
                <Package className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider">Inventory Health</p>
                <div className="flex items-baseline justify-between mt-0.5">
                  <span className="text-xs text-muted-foreground truncate">Stock Coverage</span>
                  <span className="text-sm font-bold text-foreground">78%</span>
                </div>
              </div>
            </div>
            <Progress value={78} className="h-1.5 mt-3.5 bg-blue-500/10 [&>div]:bg-blue-500" />
          </Card>

          <Card className="group relative overflow-hidden bg-card border border-border/50 hover:border-emerald-500/20 shadow-sm transition-all duration-300 rounded-xl p-4 flex flex-col justify-between">
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform duration-300">
                <Tags className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider">Attribute Usage</p>
                <div className="flex items-baseline justify-between mt-0.5">
                  <span className="text-xs text-muted-foreground truncate">Products with Attributes</span>
                  <span className="text-sm font-bold text-foreground">92%</span>
                </div>
              </div>
            </div>
            <Progress value={92} className="h-1.5 mt-3.5 bg-emerald-500/10 [&>div]:bg-emerald-500" />
          </Card>

          <Card className="group relative overflow-hidden bg-card border border-border/50 hover:border-indigo-500/20 shadow-sm transition-all duration-300 rounded-xl p-4 flex flex-col justify-between">
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform duration-300">
                <Layers className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider">Variant Coverage</p>
                <div className="flex items-baseline justify-between mt-0.5">
                  <span className="text-xs text-muted-foreground truncate">Products with Variants</span>
                  <span className="text-sm font-bold text-foreground">64%</span>
                </div>
              </div>
            </div>
            <Progress value={64} className="h-1.5 mt-3.5 bg-indigo-500/10 [&>div]:bg-indigo-500" />
          </Card>
        </div>
      </div>
    </div>
  );
}
