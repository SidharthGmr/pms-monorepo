'use client';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { StatusValues } from '@pms/types';
import { Eye, EyeOff } from 'lucide-react';

// The Published / Draft choice as a single compact switch row — the one-line sibling of
// StatusCards for dense forms where two cards take too much room. Colours come from the
// success/warning theme tokens (globals.css) so both light and dark mode read the same:
// success = live, warning = hidden.
interface StatusSwitchProps {
  value?: string | null;
  onChange: (value: string) => void;
  publishedLabel?: string;
  draftLabel?: string;
  disabled?: boolean;
  className?: string;
}

export default function StatusSwitch({
  value,
  onChange,
  publishedLabel = 'Published — visible in store',
  draftLabel = 'Draft — hidden',
  disabled,
  className,
}: StatusSwitchProps) {
  const published = value === StatusValues.Published;
  return (
    <div className={cn('flex h-10 items-center justify-between gap-2 rounded-lg border bg-background px-3', className)}>
      <span className={cn('flex min-w-0 items-center gap-2 text-sm font-medium', published ? 'text-success' : 'text-warning')}>
        {published ? <Eye className="h-4 w-4 shrink-0" /> : <EyeOff className="h-4 w-4 shrink-0" />}
        <span className="truncate">{published ? publishedLabel : draftLabel}</span>
      </span>
      <Switch
        checked={published}
        onCheckedChange={(checked) => onChange(checked ? StatusValues.Published : StatusValues.Draft)}
        disabled={disabled}
        aria-label="Published"
      />
    </div>
  );
}
