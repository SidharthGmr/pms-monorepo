import { Skeleton } from '@/components/ui/skeleton';

export default function ManagePriceHistorySkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-14 w-full rounded-md" />
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-16 w-full rounded-md" />
        <Skeleton className="h-16 w-full rounded-md" />
      </div>
      <Skeleton className="h-16 w-full rounded-md" />
      <Skeleton className="h-16 w-full rounded-md" />
    </div>
  );
}
