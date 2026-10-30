import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '../ui/card';

export default function ProductViewSkeleton() {
  return (
    <Card className="!p-0 overflow-hidden">
      <div className="border-b bg-muted/40 px-4 py-4 sm:px-6">
        <Skeleton className="h-6 w-56" />
        <Skeleton className="mt-2 h-4 w-40" />
      </div>
      <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <Skeleton className="aspect-square w-full rounded-xl" />
        <div className="space-y-4">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      </div>
    </Card>
  );
}
