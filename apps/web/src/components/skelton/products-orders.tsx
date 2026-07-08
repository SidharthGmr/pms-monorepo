import { Skeleton } from '@/components/ui/skeleton';

export default function ProductsOrdersSkeleton() {
  return (
    <div className="space-y-4 w-full">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="space-y-2">
          {/* Label and Count */}
          <div className="flex justify-between items-center">
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="h-4 w-16 rounded" />
          </div>
          {/* Progress bar */}
          <Skeleton className="h-2 w-full rounded-full" />
        </div>
      ))}
    </div>
  );
}
