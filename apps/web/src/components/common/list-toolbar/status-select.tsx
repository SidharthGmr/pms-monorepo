'use client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

export interface StatusOption<T extends string | null = string | null> {
  label: string;
  value: T;
  dot?: string;
}

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
  total?: number;
  loading?: boolean;
  className?: string;
  ariaLabel?: string;
}

export default function StatusSelect<T extends string | null>({
  value,
  onChange,
  options,
  className,
  ariaLabel = 'Filter by status',
}: StatusSelectProps<T>) {
  const active = options.find((option) => option.value === value) ?? options[0];

  return (
    <Select value={active.label} onValueChange={(label) => onChange((options.find((option) => option.label === label) ?? options[0]).value)}>
      <SelectTrigger className={cn(' [&>span]:min-w-0', className)} aria-label={ariaLabel}>
        <SelectValue />
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
