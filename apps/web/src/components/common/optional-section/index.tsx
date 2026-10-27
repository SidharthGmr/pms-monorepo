'use client';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';
import { ReactNode, useState } from 'react';

interface OptionalSectionProps {
  title: string;
  children: ReactNode;
  /** Rendered before the title in the header row, e.g. a colour swatch. */
  leading?: ReactNode;
  summary?: string;
  badge?: string;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  contentClassName?: string;
}

export default function OptionalSection({
  title,
  children,
  leading,
  summary,
  badge = 'Optional',
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
  className,
  contentClassName,
}: OptionalSectionProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const open = controlledOpen ?? internalOpen;
  const toggle = () => {
    setInternalOpen(!open);
    onOpenChange?.(!open);
  };
  return (
    <section className={cn('overflow-hidden rounded-xl border overflow-y-auto', className)}>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="flex w-full items-center gap-2.5 px-4 py-3 text-left transition-colors hover:bg-muted/40"
      >
        {leading}
        <span className="min-w-0 flex-1 text-sm font-semibold leading-tight">{title}</span>
        {!open && summary && <span className="hidden truncate text-[11px] text-muted-foreground sm:inline">{summary}</span>}
        {badge && (
          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {badge}
          </span>
        )}
        <ChevronDown className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>

      {open && <div className={cn('space-y-5 border-t px-4 py-4', contentClassName)}>{children}</div>}
    </section>
  );
}
