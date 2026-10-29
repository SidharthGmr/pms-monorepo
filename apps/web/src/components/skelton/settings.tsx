import { Skeleton } from '@/components/ui/skeleton';

const SURFACE = 'rounded-xl border border-border/70 bg-card shadow-sm';

function SectionHeaderSkeleton({ titleWidth, descriptionWidth }: { titleWidth: string; descriptionWidth: string }) {
  return (
    <div className="flex items-center gap-3 border-b border-border/70 px-4 py-3.5 sm:px-5">
      <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
      <div className="min-w-0 space-y-1.5">
        <Skeleton className={`h-4 ${titleWidth} rounded`} />
        <Skeleton className={`h-3 ${descriptionWidth} max-w-full rounded`} />
      </div>
    </div>
  );
}

function FieldSkeleton({ labelWidth, helperWidth }: { labelWidth: string; helperWidth: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Skeleton className="h-3.5 w-3.5 rounded" />
        <Skeleton className={`h-3 ${labelWidth} rounded`} />
      </div>
      <Skeleton className="h-10 w-full rounded-md" />
      <Skeleton className={`h-3 ${helperWidth} max-w-full rounded`} />
    </div>
  );
}

export function BrandingTabSkeleton() {
  return (
    <div className="grid gap-4 sm:gap-5">
      <div className="grid gap-4 sm:gap-5 lg:grid-cols-2 lg:items-start">
        <section className={`${SURFACE} overflow-hidden`}>
          <SectionHeaderSkeleton titleWidth="w-14" descriptionWidth="w-80" />
          <div className="p-4 sm:p-5">
            <div className="flex h-44 flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-4 w-56 rounded" />
              <Skeleton className="h-3 w-48 rounded" />
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Skeleton className="h-9 w-28 rounded-md" />
              <Skeleton className="ml-auto h-4 w-32 rounded" />
            </div>
          </div>
        </section>

        <section className={`${SURFACE} overflow-hidden`}>
          <SectionHeaderSkeleton titleWidth="w-28" descriptionWidth="w-96" />
          <div className="grid gap-4 p-4 sm:p-5">
            <FieldSkeleton labelWidth="w-20" helperWidth="w-80" />
            <FieldSkeleton labelWidth="w-28" helperWidth="w-72" />
          </div>
        </section>
      </div>

      <div className={`${SURFACE} flex flex-wrap items-center gap-3 px-4 py-3 sm:px-5`}>
        <Skeleton className="h-2 w-2 shrink-0 rounded-full" />
        <Skeleton className="h-4 w-36 rounded" />
        <div className="ml-auto flex gap-2">
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-9 w-32 rounded-md" />
        </div>
      </div>
    </div>
  );
}

export default function SettingsSkeleton() {
  return (
    <div className="grid gap-4 sm:gap-5">
      <section className={`${SURFACE} overflow-hidden`}>
        <div className="flex items-center gap-4 bg-muted/50 px-5 py-6 sm:px-6">
          <Skeleton className="h-12 w-12 shrink-0 rounded-xl" />
          <div className="min-w-0 space-y-2">
            <Skeleton className="h-6 w-32 rounded" />
            <Skeleton className="h-4 w-[28rem] max-w-full rounded" />
          </div>
        </div>
      </section>
      <div className="flex w-full gap-1 rounded-xl border border-border/70 bg-muted/50 p-1">
        <Skeleton className="h-9 w-28 rounded-lg" />
        <Skeleton className="h-9 w-40 rounded-lg" />
        <Skeleton className="h-9 w-40 rounded-lg" />
      </div>
      <BrandingTabSkeleton />
    </div>
  );
}
