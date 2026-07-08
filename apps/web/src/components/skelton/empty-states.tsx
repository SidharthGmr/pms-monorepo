import { CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Layers, Package, ShoppingBag, Star, LucideIcon } from 'lucide-react';
import Link from 'next/link';

interface DashboardEmptyStateProps {
  title: string;
  description?: string;
  ctaTitle: string;
  ctaUrl: string;
  icon?: LucideIcon;
}

export function DashboardEmptyState({ 
  title, 
  description, 
  ctaTitle, 
  ctaUrl, 
  icon: Icon = Star 
}: DashboardEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 text-muted-foreground/50" />
      </div>
      <h3 className="text-sm font-semibold text-foreground mb-1">{title}</h3>
      {description && <p className="text-xs text-muted-foreground mb-4 max-w-sm">{description}</p>}
      <Link href={ctaUrl}>
        <Button size="sm" className="rounded-full px-4 shadow-md hover:shadow-lg transition-shadow">
          {ctaTitle}
        </Button>
      </Link>
    </div>
  );
}

export function EmptyRecentOrders() {
  return (
    <div className="p-8 text-center text-muted-foreground flex flex-col items-center gap-3">
      <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
        <Package className="w-8 h-8 text-muted-foreground/50" />
      </div>
      <CardDescription>No recent orders found.</CardDescription>
    </div>
  );
}

export function EmptyRecentProducts() {
  return (
    <DashboardEmptyState
      title="No recent products"
      description="Start adding products to populate your list."
      ctaTitle="Create Product"
      ctaUrl="/admin/products/create"
      icon={ShoppingBag}
    />
  );
}

export function EmptyLowStockAlerts() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="relative animate-fade-in">
        <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full animate-pulse" />
        <div className="h-20 w-20 rounded-full bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/40 dark:to-emerald-800/40 flex items-center justify-center mb-4 relative border border-emerald-200 dark:border-emerald-800/50 shadow-lg">
          <Package className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
          <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-emerald-500 rounded-full border-2 border-background flex items-center justify-center shadow-sm animate-bounce">
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
      </div>
      <h3 className="text-lg font-bold text-foreground mb-1">Inventory looks great!</h3>
      <p className="text-xs text-muted-foreground mb-4 max-w-sm">All products are well-stocked.</p>
      <Link href="/admin/products">
        <Button variant="outline" size="sm" className="rounded-full border-emerald-200 hover:bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:hover:bg-emerald-900/30 dark:text-emerald-400 transition-all">
          View All Inventory
        </Button>
      </Link>
    </div>
  );
}

export function EmptyRecentAttributes() {
  return (
    <DashboardEmptyState
      title="No recent attributes"
      description="Create attributes to add dynamic variations to products."
      ctaTitle="Create Attribute"
      ctaUrl="/admin/attributes/create"
      icon={Star}
    />
  );
}

export function EmptyProductsOrders() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center w-full">
      <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
        <Layers className="h-8 w-8 text-muted-foreground/50" />
      </div>
      <p className="text-sm text-muted-foreground">No category data available</p>
    </div>
  );
}
