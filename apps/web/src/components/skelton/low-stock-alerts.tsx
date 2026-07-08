import { Skeleton } from '@/components/ui/skeleton';

export default function LowStockAlertsSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex flex-col p-3 bg-rose-50/10 dark:bg-rose-950/5 border border-rose-100/50 dark:border-rose-900/20 rounded-xl relative overflow-hidden"
        >
          {/* Side Indicator Stripe */}
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-300 dark:bg-rose-800" />

          {/* Header Row */}
          <div className="flex items-center justify-between gap-2 mb-1.5 pl-1.5">
            <Skeleton className="h-4.5 w-28 rounded" />
            <div className="flex items-center gap-1.5 shrink-0">
              <Skeleton className="h-4 w-12 rounded" />
              <Skeleton className="h-6 w-6 rounded-full" />
            </div>
          </div>

          {/* SKU & Price */}
          <div className="flex items-center justify-between pl-1.5 mb-2">
            <Skeleton className="h-3 w-20 rounded" />
            <Skeleton className="h-3.5 w-10 rounded" />
          </div>

          {/* Stock Indicator Progress bar */}
          <div className="mt-1 px-1.5 py-1 bg-background/50 rounded-lg flex items-center justify-between gap-4">
            <Skeleton className="h-3.5 w-24 rounded" />
            <Skeleton className="h-1.5 w-16 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
