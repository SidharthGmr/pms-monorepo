import { CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

// Small shared record-display helpers: the label/value row every details panel is built from,
// plus the little status fragments that repeat around it. Colours come from theme tokens only.

interface FieldProps {
  label: string;
  value: ReactNode;
  className?: string;
}

/** One label/value row of a details panel: label left, value right, dashed divider between rows. */
export function Field({ label, value, className }: FieldProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4 border-b border-dashed py-2 last:border-0', className)}>
      <dt className="shrink-0 text-xs text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words text-right text-sm font-medium">{value}</dd>
    </div>
  );
}

/** A boolean as dot + word: success when true, muted when false. */
export function Flag({ value, yes = 'Yes', no = 'No', className }: { value?: boolean; yes?: string; no?: string; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-sm font-medium', value ? 'text-success' : 'text-muted-foreground', className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', value ? 'bg-success' : 'bg-muted-foreground/50')} />
      {value ? yes : no}
    </span>
  );
}

/** Unsaved-changes hint for a form footer. */
export function DirtyNote({ dirty, className }: { dirty: boolean; className?: string }) {
  return (
    <CardDescription className={cn('hidden items-center gap-1.5 text-xs sm:flex', dirty ? 'text-warning' : 'text-muted-foreground', className)}>
      {dirty && <span className="h-1.5 w-1.5 rounded-full bg-warning" />}
      {dirty ? 'Unsaved changes' : 'No changes yet'}
    </CardDescription>
  );
}

export default Field;
