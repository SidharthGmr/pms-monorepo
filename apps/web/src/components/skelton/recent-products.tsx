import { Skeleton } from '@/components/ui/skeleton';

export default function RecentProductsSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="flex items-center justify-between p-3 bg-background border border-border/40 rounded-xl"
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Product Icon */}
            <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
            <div className="flex-1 min-w-0 space-y-1.5">
              {/* Product Name & New Badge */}
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-36 rounded" />
                {i === 1 && <Skeleton className="h-3.5 w-8 rounded" />}
              </div>
              {/* SKU & Stock */}
              <div className="flex items-center gap-2">
                <Skeleton className="h-3 w-20 rounded" />
                <Skeleton className="h-3 w-12 rounded" />
              </div>
            </div>
          </div>
          {/* Price & Action Button */}
          <div className="flex items-center gap-2 pl-3 border-l border-border/40 shrink-0">
            <Skeleton className="h-4 w-12 rounded" />
            <Skeleton className="h-6 w-6 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
