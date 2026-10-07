'use client';
import { Button } from '@/components/ui/button';
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusValues } from '@/enums/status-values.enum';
import { useGetBrandNameById } from '@/hooks/service-hooks/useBrandNameService';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { Eye, EyeOff, ImageOff, Pencil, Sparkles, Trash2 } from 'lucide-react';
import { ReactNode } from 'react';

/** Same colours and wording the form's status cards use, so view and edit read alike. */
const STATUS_TONE: Record<string, { label: string; hint: string; icon: typeof Eye; pill: string; dot: string }> = {
  [StatusValues.Published]: {
    label: 'Published',
    hint: 'Visible in the store. Customers can shop this brand.',
    icon: Eye,
    pill: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    dot: 'bg-emerald-500',
  },
  [StatusValues.Draft]: {
    label: 'Draft',
    hint: 'Hidden from the store until you publish it.',
    icon: EyeOff,
    pill: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
    dot: 'bg-amber-500',
  },
  [StatusValues.Trash]: {
    label: 'Trash',
    hint: 'Moved to Trash. Restore it to bring it back.',
    icon: Trash2,
    pill: 'bg-rose-500/10 text-rose-700 dark:text-rose-400',
    dot: 'bg-rose-500',
  },
};

interface BrandNameViewProps {
  id: number;
  onEdit: () => void;
  onClose: () => void;
}

// Read-only half of the brand dialog: what is stored, nothing to type into. "Edit" hands the
// same dialog over to the form, so the data is read and changed in one place.
export default function BrandNameView({ id, onEdit, onClose }: BrandNameViewProps) {
  const { data, isLoading, isError } = useGetBrandNameById(id, id > 0);
  const brand = data?.data?.data;

  const when = (value?: Date | string | null) => {
    if (!value) return '—';
    const date = new Date(value);
    return (
      <span title={format(date, 'PPpp')}>
        {format(date, 'd MMM yyyy, h:mm a')}
        <span className="ml-1 text-muted-foreground/70">({formatDistanceToNow(date, { addSuffix: true })})</span>
      </span>
    );
  };

  const status = brand ? (STATUS_TONE[brand.status] ?? STATUS_TONE[StatusValues.Draft]) : null;
  const logo = brand?.images?.[0];

  return (
    <>
      <DialogHeader className="border-b px-5 py-4">
        <div className="flex items-center gap-3 pr-8">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Sparkles className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <DialogTitle className="truncate text-base">{isLoading ? 'Brand' : (brand?.name ?? 'Brand')}</DialogTitle>
            <DialogDescription className="mt-1 text-xs">Everything stored against this brand. Use Edit to change it.</DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        ) : isError || !brand ? (
          <div className="py-10 text-center">
            <p className="text-sm font-semibold text-destructive">Could not load this brand</p>
            <p className="mt-1 text-xs text-muted-foreground">Close this and try again.</p>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex h-32 items-center justify-center rounded-xl border bg-gradient-to-b from-muted/60 to-muted/20 p-4">
              {logo ? (
                // Brand logos come from arbitrary CDNs; next/image would need each host in
                // `next.config.mjs` remotePatterns, so a plain <img> keeps unknown hosts working.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo} alt={brand.name} className="max-h-full max-w-[70%] object-contain" />
              ) : (
                <div className="flex flex-col items-center gap-1 text-muted-foreground/50">
                  <ImageOff className="h-7 w-7" />
                  <span className="text-[11px]">No logo uploaded</span>
                </div>
              )}
            </div>

            {status && (
              <div className={cn('flex items-start gap-3 rounded-xl border px-3 py-2.5', status.pill)}>
                <status.icon className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{status.label}</p>
                  <p className="text-xs opacity-80">{status.hint}</p>
                </div>
              </div>
            )}

            <dl className="grid gap-x-6">
              <Field label="Brand name" value={brand.name} />
              <Field label="Display order" value={brand.displayOrder ?? '—'} />
              <Field label="Brand ID" value={<span className="font-mono text-xs">{brand.id}</span>} />
              <Field label="Images" value={brand.images?.length ? `${brand.images.length} uploaded` : 'None'} />
              <Field label="Added" value={when(brand.createdAt)} />
              <Field label="Last updated" value={when(brand.updatedAt)} />
            </dl>
          </div>
        )}
      </div>

      <DialogFooter className="border-t px-5 py-4">
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button type="button" className="gap-1.5" onClick={onEdit} disabled={isLoading || isError || !brand}>
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
        </div>
      </DialogFooter>
    </>
  );
}

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-dashed py-2 last:border-0">
      <dt className="shrink-0 text-xs text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words text-right text-sm font-medium">{value}</dd>
    </div>
  );
}
