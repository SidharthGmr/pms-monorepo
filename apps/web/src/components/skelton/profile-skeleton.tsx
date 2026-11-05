import { Skeleton } from '@/components/ui/skeleton';

const SURFACE = 'rounded-xl border border-border/70 bg-card shadow-sm';

/** One labelled input placeholder, matching the profile form's field blocks. */
function FieldSkeleton({ labelWidth = 'w-20' }: { labelWidth?: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Skeleton className="h-3.5 w-3.5 rounded" />
        <Skeleton className={`h-3 ${labelWidth} rounded`} />
      </div>
      <Skeleton className="h-10 w-full rounded-md" />
    </div>
  );
}

function SectionCardSkeleton({ fields, columns = 2 }: { fields: string[]; columns?: 1 | 2 }) {
  return (
    <section className={`${SURFACE} overflow-hidden`}>
      <div className="flex items-center gap-3 border-b border-border/70 px-4 py-3.5 sm:px-5">
        <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
        <div className="min-w-0 space-y-1.5">
          <Skeleton className="h-4 w-32 rounded" />
          <Skeleton className="h-3 w-56 max-w-full rounded" />
        </div>
      </div>
      <div className={`grid gap-4 p-4 sm:p-5 ${columns === 2 ? 'sm:grid-cols-2' : ''}`}>
        {fields.map((labelWidth, index) => (
          <FieldSkeleton key={index} labelWidth={labelWidth} />
        ))}
      </div>
    </section>
  );
}

/** Mirrors AdminProfilePage's layout: header row, avatar/completeness aside, form section cards. */
export default function ProfileSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-4 pb-24 sm:space-y-5">
      {/* Title row + save button */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-36 rounded" />
          <Skeleton className="h-4 w-72 max-w-full rounded" />
        </div>
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start">
        {/* Left: avatar card + completeness */}
        <aside className="space-y-4 sm:space-y-5">
          <section className={`${SURFACE} overflow-hidden`}>
            <Skeleton className="h-24 w-full rounded-none" />
            <div className="-mt-14 flex flex-col items-center px-4 pb-5 text-center">
              <Skeleton className="h-32 w-32 rounded-full border-4 border-background" />
              <Skeleton className="mt-3 h-5 w-36 rounded" />
              <Skeleton className="mt-2 h-3.5 w-24 rounded" />
              <div className="mt-3 flex gap-2">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
            </div>
          </section>

          <section className={`${SURFACE} space-y-3 p-4 sm:p-5`}>
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-36 rounded" />
              <Skeleton className="h-4 w-10 rounded" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
            <div className="flex flex-wrap gap-1.5">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-14 rounded-full" />
            </div>
          </section>
        </aside>

        {/* Right: the form's section cards */}
        <div className="space-y-4 sm:space-y-5">
          <SectionCardSkeleton fields={['w-20', 'w-24', 'w-16', 'w-24']} />
          <SectionCardSkeleton fields={['w-24', 'w-14', 'w-16', 'w-20', 'w-24', 'w-20']} />
          <SectionCardSkeleton fields={['w-12']} columns={1} />
        </div>
      </div>
    </div>
  );
}
