'use client';
import { LayoutGrid, Table2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ListView = 'grid' | 'table';

const VIEWS: { value: ListView; label: string; short: string; icon: typeof LayoutGrid }[] = [
  { value: 'grid', label: 'Card view', short: 'Cards', icon: LayoutGrid },
  { value: 'table', label: 'Table view', short: 'Table', icon: Table2 },
];

interface ViewSwitchProps {
  value: ListView;
  onChange: (view: ListView) => void;
  className?: string;
  /** Icons only, with the label kept for the tooltip and screen readers. */
  iconOnly?: boolean;
}

// Cards / Table toggle for listing pages. The stored choice lives with the page, not here.
export default function ViewSwitch({ value, onChange, className, iconOnly = false }: ViewSwitchProps) {
  return (
    <div className={cn('inline-flex rounded-md border bg-muted/40 p-0.5', className)} role="radiogroup" aria-label="Layout">
      {VIEWS.map(({ value: v, label, short, icon: Icon }) => {
        const active = v === value;
        return (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            title={label}
            onClick={() => onChange(v)}
            className={cn(
              'inline-flex h-7 items-center gap-1.5 rounded text-xs font-medium transition-colors',
              iconOnly ? 'w-8 justify-center' : 'px-2.5',
              active ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {!iconOnly && <span className="hidden sm:inline">{short}</span>}
          </button>
        );
      })}
    </div>
  );
}

// Per-browser memory of the chosen layout; storage can be blocked, so both directions are guarded.
export const readStoredView = (key: string): ListView | null => {
  try {
    const stored = window.localStorage.getItem(key);
    return stored === 'table' || stored === 'grid' ? stored : null;
  } catch {
    return null;
  }
};

export const storeView = (key: string, view: ListView) => {
  try {
    window.localStorage.setItem(key, view);
  } catch {
    return;
  }
};
