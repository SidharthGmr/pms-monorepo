'use client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

export interface StatusOption<T extends string | null = string | null> {
  label: string;
  value: T;
  /** Tailwind background class for the coloured dot, e.g. `bg-emerald-500`. */
  dot?: string;
}

/** All / Published / Draft / Trash, the set every catalog list filters by. `null` = everything except Trash. */
export const STATUS_FILTER_OPTIONS: StatusOption<'Published' | 'Draft' | 'Trash' | null>[] = [
  { label: 'All', value: null },
  { label: 'Published', value: 'Published', dot: 'bg-emerald-500' },
  { label: 'Draft', value: 'Draft', dot: 'bg-amber-500' },
  { label: 'Trash', value: 'Trash', dot: 'bg-rose-500' },
];

interface StatusSelectProps<T extends string | null> {
  value: T;
  onChange: (value: T) => void;
  options: StatusOption<T>[];
  /** Count of matching records, shown as a pill beside the chosen option. */
  total?: number;
  loading?: boolean;
  className?: string;
  ariaLabel?: string;
}

// A select whose options carry a coloured dot. Values may be null (for "All"), which Radix's
// Select cannot hold, so options are keyed by label internally.
export default function StatusSelect<T extends string | null>({
  value,
  onChange,
  options,
  total,
  loading,
  className,
  ariaLabel = 'Filter by status',
}: StatusSelectProps<T>) {
  const active = options.find((option) => option.value === value) ?? options[0];

  return (
    <Select value={active.label} onValueChange={(label) => onChange((options.find((option) => option.label === label) ?? options[0]).value)}>
      <SelectTrigger className={cn('h-9 [&>span]:min-w-0', className)} aria-label={ariaLabel}>
        <SelectValue />
        <span className="flex min-w-0 flex-nowrap items-center gap-2 whitespace-nowrap [&>span]:truncate">
          {total !== undefined && (
            <span
              className={cn(
                'shrink-0 rounded-full bg-primary/10 px-1.5 text-[11px] font-semibold leading-5 tabular-nums text-primary',
                loading && 'opacity-60'
              )}
            >
              {total}
            </span>
          )}
        </span>
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.label} value={option.label}>
            <span className="flex items-center gap-2 whitespace-nowrap">
              <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', option.dot ?? 'bg-muted-foreground')} />
              {option.label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
