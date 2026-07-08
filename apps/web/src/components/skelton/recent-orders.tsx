import { Skeleton } from '@/components/ui/skeleton';

export default function RecentOrdersSkeleton() {
  return (
    <div className="flex flex-col gap-3 p-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-background border border-border/50 rounded-2xl gap-4"
        >
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {/* Status Icon Placeholder */}
            <Skeleton className="w-11 h-11 rounded-2xl shrink-0" />
            <div className="flex-1 min-w-0 space-y-2">
              {/* Order Number & Status Badge */}
              <div className="flex items-center gap-2.5">
                <Skeleton className="h-5 w-32 rounded-md" />
                <Skeleton className="h-4 w-16 rounded" />
              </div>

              {/* Metadata Pills */}
              <div className="flex flex-wrap items-center gap-2">
                <Skeleton className="h-6 w-28 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            </div>
          </div>

          {/* Grand Total & Action Link */}
          <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
            <Skeleton className="h-10 w-24 rounded-2xl" />
          </div>
        </div>
      ))}
    </div>
  );
}
