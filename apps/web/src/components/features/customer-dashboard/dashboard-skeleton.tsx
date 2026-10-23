import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/** A row placeholder shared by the orders and returns cards. */
function RowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 sm:px-5">
      <Skeleton className="h-9 w-9 rounded-lg" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3.5 w-40 max-w-full" />
        <Skeleton className="h-2.5 w-28 max-w-full" />
      </div>
      <Skeleton className="h-4 w-14" />
    </div>
  );
}

function ListCardSkeleton({ rows }: { rows: number }) {
  return (
    <Card className="!p-0 overflow-hidden">
      <div className="flex items-center justify-between border-b px-4 py-3 sm:px-5">
        <div className="space-y-1.5">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-2.5 w-44 max-w-full" />
        </div>
        <Skeleton className="h-5 w-8 rounded-full" />
      </div>
      <div className="divide-y">
        {Array.from({ length: rows }).map((_, index) => (
          <RowSkeleton key={index} />
        ))}
      </div>
    </Card>
  );
}

/**
 * The customer dashboard's shape while the session and first queries resolve: the hero banner,
 * the four stat tiles, and the two-column body - so the page never jumps when the data lands.
 */
export default function CustomerDashboardSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Loading dashboard">
      {/* Hero banner */}
      <div className="flex items-center justify-between gap-4 rounded-2xl border bg-muted/30 px-5 py-6 sm:px-7">
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-56 max-w-full" />
            <Skeleton className="h-3.5 w-72 max-w-full" />
          </div>
        </div>
        <div className="hidden shrink-0 items-center gap-2 sm:flex">
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="!p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <Skeleton className="h-2.5 w-16" />
                <Skeleton className="h-7 w-20" />
                <Skeleton className="h-2.5 w-24" />
              </div>
              <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />
            </div>
          </Card>
        ))}
      </div>

      {/* Orders + returns on the left, profile and activity on the right */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <ListCardSkeleton rows={4} />
          <ListCardSkeleton rows={2} />
        </div>

        <div className="space-y-4">
          <Card className="!p-0 overflow-hidden">
            <div className="flex items-center gap-3 border-b bg-muted/40 px-4 py-3.5 sm:px-5">
              <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-2.5 w-20" />
              </div>
            </div>
            <div className="space-y-2.5 p-4 sm:p-5">
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-3/4" />
              <Skeleton className="h-3.5 w-2/3" />
              <Skeleton className="h-3.5 w-1/2" />
            </div>
          </Card>

          <Card className="!p-0 overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3.5 sm:px-5">
              <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-2.5 w-36 max-w-full" />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
