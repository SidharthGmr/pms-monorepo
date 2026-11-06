'use client';

import { DETAIL_SURFACE } from '@/components/common/detail-document';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// Mirrors the detail-document layout block for block so nothing jumps when the data lands.
export default function DetailDocumentSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-5" aria-busy aria-label="Loading">
      <Skeleton className="h-3 w-20" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 sm:gap-5">
        <div className={cn(DETAIL_SURFACE, 'overflow-hidden lg:col-span-2')}>
          <div className="flex items-start justify-between gap-4 border-b border-border/70 p-4 sm:p-5">
            <div className="flex items-center gap-3.5">
              <Skeleton className="hidden h-12 w-12 rounded-xl sm:block" />
              <div className="space-y-2">
                <Skeleton className="h-2.5 w-20" />
                <Skeleton className="h-7 w-44" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-2.5 w-20" />
              <Skeleton className="h-7 w-28" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-px bg-border/70 sm:grid-cols-2">
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="space-y-2 bg-card p-4 sm:p-5">
                <Skeleton className="h-2.5 w-12" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-40" />
              </div>
            ))}
          </div>

          <div className="divide-y divide-border/70 border-t border-border/70">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3 p-4 sm:p-5">
                <Skeleton className="h-11 w-11 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 border-t border-border/70 bg-muted/30 p-4 sm:p-5 lg:grid-cols-2">
            <Skeleton className="h-10 w-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
          </div>
        </div>

        <div className="space-y-4 sm:space-y-5">
          <div className={cn(DETAIL_SURFACE, 'overflow-hidden')}>
            <Skeleton className="h-14 w-full rounded-none" />
            <div className="space-y-4 p-4 sm:p-5">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex gap-3">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-2.5 w-28" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className={cn(DETAIL_SURFACE, 'space-y-3 p-4 sm:p-5')}>
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-4 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
